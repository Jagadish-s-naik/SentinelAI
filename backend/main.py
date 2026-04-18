import asyncio
import os
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

from ingestion.async_ingester import AsyncSentinelIngester
from models.engine import DetectionEngine
from simulate.scenario_replay import SentinelSimulator
from playbooks.ai_generator import PlaybookGenerator

load_dotenv()

app = FastAPI(title="SentinelAI Intelligence API", version="2.0")

@app.get("/")
async def health_check():
    """Cloud Health Check (Requirement 9: Reliability)"""
    return {
        "status": "active",
        "system": "SentinelAI-Core",
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "processed": pipeline_metrics["total_processed"],
            "uptime": str(datetime.now() - pipeline_metrics["start_time"])
        }
    }

# Dynamic CORS for Production
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3006")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3006", "*"] if os.getenv("DEBUG") else [frontend_url, "http://localhost:3006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Shared State
engine = DetectionEngine()
ingester = AsyncSentinelIngester("logs/sentinel.log")
simulator = SentinelSimulator("logs/sentinel.log")
playbook_gen = PlaybookGenerator()

# Telemetry Metrics tracking
pipeline_metrics = {
    "total_processed": 0,
    "start_time": datetime.now(),
    "last_pulse": datetime.now(),
    "events_last_minute": 0,
    "layer_distribution": {"network": 0, "endpoint": 0, "api": 0},
    "auto_remediation": True # Default ON for safety simulation
}

# In-Memory Incident Store — ultra-fast, no DB dependency
in_memory_incidents: List[Dict[str, Any]] = []
MAX_INCIDENT_BUFFER = 500

class LogEntry(BaseModel):
    raw: str
    layer: str = "network"

class EngineSettings(BaseModel):
    active_models: List[str]
    alert_threshold: float

@app.on_event("startup")
async def startup_event():
    """Requirement 1 & 9: Start background asyncio ingester on startup."""
    print("[BACKEND] Initializing SentinelAI Pipeline...")
    asyncio.create_task(ingester.watch_file())
    
    # Set the engine callback
    ingester.callback = process_normalized_event

async def process_normalized_event(event: Dict[str, Any]):
    """The central pipeline logic connecting normalization to detection."""
    print(f"[PIPELINE] Processing event: {event.get('action')}")
    # 1. Detection Phase (Requirement 3)
    alert = await engine.analyze_event(event)
    
    # 2. Storage Phase (Push Raw log to Supabase)
    try:
        pipeline_metrics["total_processed"] += 1
        pipeline_metrics["last_pulse"] = datetime.now()
        pipeline_metrics["layer_distribution"][event.get("layer", "network")] += 1
        
        await asyncio.to_thread(supabase.table("raw_logs").insert({
            "timestamp": event["timestamp"],
            "layer": event["layer"],
            "raw": f"PROCESSED_BY_AI: {event['event_type']}",
            "normalized": event
        }).execute)
    except Exception as e:
        print(f"[PIPELINE] Supabase Insert Error: {e}")

    # 3. Alert Phase (If ML model triggers)
    if alert:
        import uuid
        print(f"[PIPELINE] ALERT: {alert['type']} (Confidence: {alert['confidence']}%)")
        
        incident_id = str(uuid.uuid4())
        
        # Format for React Frontend Schema (Requirement 8)
        incident_data = {
            "id": incident_id,
            "timestamp": datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
            "layer": event["layer"],
            "type": alert["type"],
            "title": alert["type"].replace("_", " ").title(),
            "severity": alert["severity"],
            "explanation": alert["explanation"],
            "mitre_tag": alert["mitre_tag"],
            "src_ip": event.get("src_ip", "0.0.0.0"),
            "target": event.get("target", "LOCAL_SRV"),
            "confidence": alert["confidence"],
            "is_false_positive": alert.get("is_false_positive", False),
            "shap_features": alert["shap_features"],
            "status": "ACTIVE",
            "history": [
                {
                    "time": datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
                    "action": f"Incident Detected: {alert['type'].replace('_', ' ').title()}",
                    "status": "ANALYZING"
                }
            ]
        }
        
        # ✅ PRIMARY: Store in-memory (always works, no DB dependency)
        in_memory_incidents.insert(0, incident_data)
        if len(in_memory_incidents) > MAX_INCIDENT_BUFFER:
            in_memory_incidents.pop()

        # SECONDARY: Push to Supabase (best-effort)
        supabase_payload = incident_data.copy()
        try:
            await asyncio.to_thread(supabase.table("incidents").insert(supabase_payload).execute)
        except Exception as e:
            print(f"[PIPELINE] Supabase incident insert skipped: {e}")

        # 4. Auto-Remediation Phase (Requirement 7)
        if pipeline_metrics["auto_remediation"] and not alert.get("is_false_positive"):
            print(f"[PROTECTION] Auto-Mitigation Triggered for {incident_data['src_ip']} (Reason: {alert['type']})")
            engine.mitigate_entity(incident_data['src_ip'])
            # Mirror mitigation in in-memory store
            mitigation_entry = {
                "time": datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
                "action": f"Automated Mitigation Triggered: Network Block Enforced",
                "status": "COMPLETED"
            }
            for inc in in_memory_incidents:
                if inc['id'] == incident_id:
                    inc['status'] = 'MITIGATED'
                    inc['explanation'] = alert['explanation'] + ' [AUTO-BLOCKED BY SENTINEL]'
                    inc['history'].append(mitigation_entry)
            
            # Best-effort Supabase update
            try:
                await asyncio.to_thread(supabase.table("incidents")
                    .update({
                        "status": "MITIGATED", 
                        "explanation": alert["explanation"] + " [AUTO-BLOCKED BY SENTINEL]",
                        "history": [h for h in incident_data['history']] + [mitigation_entry]
                    })
                    .eq("id", incident_id).execute)
            except Exception as e:
                print(f"[PIPELINE] Supabase mitigation update skipped: {e}")

@app.get("/health")
def health_check():
    return {"status": "operational", "pipeline": "active", "timestamp": datetime.now()}

@app.post("/ingest")
async def manual_ingest(entry: LogEntry):
    """Requirement 9: API endpoint for log submission."""
    # Write to log file to simulate 'external' ingestion pulse
    with open("logs/sentinel.log", "a") as f:
        f.write(f"[{datetime.now().isoformat()}] {entry.raw}\n")
    return {"message": "Log received and queued for analysis"}

@app.get("/stats")
async def get_stats():
    runtime = (datetime.now() - pipeline_metrics["start_time"]).total_seconds()
    eps = pipeline_metrics["total_processed"] / runtime if runtime > 0 else 0
    
    return {
        "status": "operational",
        "processed_events": pipeline_metrics["total_processed"],
        "eps": round(eps, 2),
        "last_pulse": pipeline_metrics["last_pulse"],
        "layer_distribution": pipeline_metrics["layer_distribution"],
        "active_models": engine.config["active_models"],
        "alert_threshold": engine.config["alert_threshold"],
        "is_ingester_running": ingester.is_running,
        "auto_remediation": pipeline_metrics["auto_remediation"],
        "mitigated_entities": list(engine.mitigated_entities)
    }

@app.get("/incidents")
async def get_incidents(limit: int = 100):
    """Backend-first incident feed. Used by frontend when Supabase is unavailable."""
    return {"incidents": in_memory_incidents[:limit]}

@app.patch("/incidents/{incident_id}")
async def update_incident(incident_id: str, update: dict):
    """Update an incident's status/history in memory (e.g., MITIGATED)."""
    for inc in in_memory_incidents:
        if inc['id'] == incident_id:
            inc.update(update)
            # Best-effort Supabase sync
            try:
                await asyncio.to_thread(supabase.table("incidents").update(update).eq("id", incident_id).execute)
            except:
                pass
            return {"success": True, "incident": inc}
    return {"error": "Incident not found"}

@app.get("/graph/{entity_id}")
async def get_incident_graph(entity_id: str, depth: int = 2):
    """Requirement 5: Extraction of entity relationships for Blast Radius."""
    return engine.tracker.get_blast_radius(entity_id, depth)

@app.post("/settings/protection")
async def update_protection(enabled: bool):
    pipeline_metrics["auto_remediation"] = enabled
    if not enabled:
        engine.reset_protections()
    return {"message": f"Auto-remediation set to {enabled}"}

@app.post("/settings/engine")
async def update_engine_settings(settings: EngineSettings):
    engine.update_settings(settings.dict())
    return {"message": "Engine configuration updated successfully", "config": engine.config}

@app.post("/simulate/{scenario_id}")
async def trigger_simulation(scenario_id: str, background_tasks: BackgroundTasks):
    """Requirement 6: Trigger attack scenarios."""
    if scenario_id == "brute_force":
        background_tasks.add_task(simulator.run_scenario_brute_force)
    elif scenario_id == "c2_beacon":
        background_tasks.add_task(simulator.run_scenario_c2_beacon)
    elif scenario_id == "admin_fp":
        background_tasks.add_task(simulator.run_scenario_admin_fp)
    elif scenario_id == "dataset_seed":
        background_tasks.add_task(simulator.seed_dataset_patterns)
    else:
        return {"error": "Invalid scenario ID"}
    return {"message": f"Scenario {scenario_id} triggered in background"}

@app.get("/playbook/{incident_id}")
async def generate_playbook(incident_id: str):
    """Requirement 5: Generate dynamic playbook for an incident."""
    # Fetch incident from Supabase
    res = await asyncio.to_thread(supabase.table("incidents").select("*").eq("id", incident_id).execute)
    if not res.data:
        return {"error": "Incident not found"}
    
    incident = res.data[0]
    steps = await playbook_gen.generate_playbook(incident)
    return {
        "incident_id": incident_id,
        "steps": steps,
        "mitre_mapping": incident.get("mitre_tag")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
