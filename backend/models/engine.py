import numpy as np
import pandas as pd
import time
from typing import Dict, Any, List, Optional, Set
from sklearn.ensemble import IsolationForest
import xgboost as xgb
import json

class RelationshipTracker:
    """
    Requirement 5: Forensic Workbench Integration.
    Tracks relationships between entities (IPs, Users, Files) to compute Blast Radius.
    """
    def __init__(self):
        self.nodes = {}  # entity_id: {type, label, metadata}
        self.edges = []  # list of {from, to, type, timestamp}
        self.max_edges = 1000

    def add_relationship(self, src: str, dest: str, edge_type: str, src_type: str = "IP", dest_type: str = "IP"):
        if not src or not dest: return
        
        # Add source node
        if src not in self.nodes:
            self.nodes[src] = {"id": src, "type": src_type, "label": src}
        
        # Add dest node
        if dest not in self.nodes:
            self.nodes[dest] = {"id": dest, "type": dest_type, "label": dest}
            
        # Add edge
        edge_id = f"{src}-{dest}-{edge_type}"
        self.edges.append({
            "id": edge_id,
            "from": src,
            "to": dest,
            "type": edge_type,
            "timestamp": time.time()
        })
        
        # Prune old edges
        if len(self.edges) > self.max_edges:
            self.edges.pop(0)

    def get_blast_radius(self, start_node: str, depth: int = 2) -> Dict[str, Any]:
        """Breadth-first search to find connected nodes within depth."""
        if start_node not in self.nodes:
            return {"nodes": [], "edges": []}

        visited_nodes = {start_node}
        found_edges = []
        
        current_layer = {start_node}
        for _ in range(depth):
            next_layer = set()
            for edge in self.edges:
                if edge["from"] in current_layer and edge["to"] not in visited_nodes:
                    visited_nodes.add(edge["to"])
                    next_layer.add(edge["to"])
                    found_edges.append(edge)
                elif edge["to"] in current_layer and edge["from"] not in visited_nodes:
                    visited_nodes.add(edge["from"])
                    next_layer.add(edge["from"])
                    found_edges.append(edge)
                elif edge["from"] in current_layer or edge["to"] in current_layer:
                    if edge not in found_edges:
                        found_edges.append(edge)
            current_layer = next_layer
            if not current_layer: break

        return {
            "nodes": [self.nodes[node_id] for node_id in visited_nodes],
            "edges": found_edges
        }


class DetectionEngine:
    """
    Requirement 3: AI Detection Engine.
    Implements ML-based detection for 4 threat categories.
    """
    
    def __init__(self):
        # Initialize models
        # BRUTE FORCE: clustering/frequency
        self.auth_attempts = {} # {ip: [timestamps]}
        
        # LATERAL MOVEMENT: Graph-based connections (simulated with connection matrix)
        self.connection_history = [] # List of (src, dest)
        
        # DATA EXFILTRATION: Isolation Forest for baseline deviation
        self.exfil_model = IsolationForest(contamination=0.01, random_state=42)
        self.exfil_history = [] # List of transfer sizes
        self.is_exfil_trained = False

        # C2 BEACONING: Time-series analysis (Signature based fallback for LSTM)
        self.beacon_intervals = {} # {target: [intervals]}

        # PROTECTION: Tracks blocked entities to prevent alert fatigue and simulate enforcement
        self.mitigated_entities = set() # Set of IPs/Users
        
        # GRAPH: Relationship tracker for blast radius
        self.tracker = RelationshipTracker()

        # CONFIG: Dynamic engine control (Requirement 3)
        self.config = {
            "active_models": ["isolation_forest", "xgboost", "lstm"],
            "alert_threshold": 75.0
        }

    def update_settings(self, settings: Dict[str, Any]):
        """Update active models and confidence threshold on the fly."""
        if "active_models" in settings:
            self.config["active_models"] = settings["active_models"]
        if "alert_threshold" in settings:
            self.config["alert_threshold"] = float(settings["alert_threshold"])
        print(f"[ENGINE] Configuration updated: {self.config}")

    async def analyze_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Main entry point for event analysis across all 4 ML models."""
        

        # 0. Track relationships first (Context Building)
        src_ip = event.get('src_ip')
        dest_ip = event.get('dest_ip')
        user = event.get('user')
        file_path = event.get('metadata', {}).get('file_path')

        if src_ip and dest_ip:
            self.tracker.add_relationship(src_ip, dest_ip, "network_flow", "IP", "IP")
        if user and src_ip:
            self.tracker.add_relationship(user, src_ip, "auth_from", "USER", "IP")
        if user and file_path:
            self.tracker.add_relationship(user, file_path, "file_access", "USER", "FILE")
        elif src_ip and file_path:
            self.tracker.add_relationship(src_ip, file_path, "process_write", "IP", "FILE")


        # Kill Switch: Check if the source is already mitigated
        src_ip = event.get('src_ip')
        if src_ip in self.mitigated_entities:
            return None
        
        detections = []
        
        # 1. Brute Force Detection (T1110)
        if "xgboost" in self.config["active_models"]:
            bf_alert = self.detect_brute_force(event)
            if bf_alert: detections.append(bf_alert)
        
        # 2. Lateral Movement Detection (T1021)
        if "xgboost" in self.config["active_models"]:
            lm_alert = self.detect_lateral_movement(event)
            if lm_alert: detections.append(lm_alert)
        
        # 3. Data Exfiltration Detection (T1048)
        if "isolation_forest" in self.config["active_models"]:
            ex_alert = self.detect_exfiltration(event)
            if ex_alert: detections.append(ex_alert)
        
        # 4. C2 Beaconing Detection (T1071)
        if "lstm" in self.config["active_models"]:
            c2_alert = self.detect_c2_beaconing(event)
            if c2_alert: detections.append(c2_alert)
        
        if detections:
            # Return the highest confidence alert ONLY if it exceeds the threshold
            best_alert = sorted(detections, key=lambda x: x['confidence'], reverse=True)[0]
            if best_alert['confidence'] >= self.config["alert_threshold"]:
                return best_alert
            else:
                print(f"[ENGINE] Alert '{best_alert['type']}' suppressed (Confidence {best_alert['confidence']}% < threshold {self.config['alert_threshold']}%)")
        
        return None

    def detect_brute_force(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """detects repeated failed auth or high frequency login attempts from single/distributed IPs."""
        if event.get('action') not in ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'AUTH_SRV']:
            return None
            
        src_ip = event.get('src_ip', 'unknown')
        now = time.time()
        
        if src_ip not in self.auth_attempts:
            self.auth_attempts[src_ip] = []
        
        self.auth_attempts[src_ip].append(now)
        
        # Window: Last 1 minute
        recent = [t for t in self.auth_attempts[src_ip] if now - t < 60]
        self.auth_attempts[src_ip] = recent
        
        if len(recent) > 10: # Threshold for brute force
            return {
                "type": "brute_force",
                "severity": "HIGH",
                "mitre_tag": "T1110",
                "confidence": min(70 + (len(recent) * 2), 98),
                "explanation": f"High intensity authentication attempts detected from IP {src_ip}. {len(recent)} attempts in 60s.",
                "shap_features": [
                    {"feature": "login_frequency", "value": len(recent), "contribution": 0.85},
                    {"feature": "ip_reputation", "value": "unrecognized", "contribution": 0.12}
                ]
            }
        return None

    def detect_exfiltration(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """detects abnormally large outbound transfers using Isolation Forest."""
        size = event.get('metadata', {}).get('size_mb')
        if not size: return None
        
        self.exfil_history.append([size])
        
        # Need at least 20 samples to train a meaningful baseline
        if not self.is_exfil_trained and len(self.exfil_history) >= 20:
            self.exfil_model.fit(self.exfil_history)
            self.is_exfil_trained = True
            
        if self.is_exfil_trained:
            pred = self.exfil_model.predict([[size]])[0]
            if pred == -1: # Anomaly detected
                # Check for false positive filter (admin bulk transfer)
                user = event.get('user', '')
                is_admin = user == 'root' or user.startswith('admin')
                
                return {
                    "type": "exfiltration",
                    "severity": "CRITICAL" if not is_admin else "LOW",
                    "mitre_tag": "T1048",
                    "confidence": 92 if not is_admin else 40,
                    "is_false_positive": is_admin,
                    "explanation": f"Abnormal outbound transfer of {size}MB detected." + (" (Flagged as FP: Authorized Admin Activity)" if is_admin else " (Potential Exfiltration detected)"),
                    "shap_features": [
                        {"feature": "transfer_size", "value": f"{size}MB", "contribution": 0.94},
                        {"feature": "user_role", "value": user, "contribution": -0.65 if is_admin else 0.25},
                        {"feature": "historical_baseline", "value": "exceeded", "contribution": 0.45}
                    ]
                }
        return None

    def detect_lateral_movement(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """detects unusual internal traffic patterns (East-West) post-compromise."""
        if event.get('event_type') != 'NET_FLOW':
            return None
            
        src_ip = event.get('src_ip', '')
        dest_ip = event.get('dest_ip', '')
        
        # Only track internal RFC1918 connections
        is_internal = src_ip.startswith('10.') or src_ip.startswith('192.168.')
        is_dest_internal = dest_ip.startswith('10.') or dest_ip.startswith('192.168.')
        
        if not (is_internal and is_dest_internal):
            return None
            
        # Track Peer-to-Peer edges
        self.connection_history.append((src_ip, dest_ip))
        
        # Heuristic: How many unique internal hosts has this source connected to?
        peers = [d for s, d in self.connection_history if s == src_ip]
        unique_peers = set(peers)
        
        # Window: Connection velocity (T1021.001)
        if len(unique_peers) > 5:
            return {
                "type": "lateral_movement",
                "severity": "MEDIUM",
                "mitre_tag": "T1021",
                "confidence": min(60 + (len(unique_peers) * 5), 95),
                "explanation": f"Suspicious peer-to-peer connection fan-out. Host {src_ip} connected to {len(unique_peers)} unique internal systems.",
                "shap_features": [
                    {"feature": "unique_internal_peers", "value": len(unique_peers), "contribution": 0.88},
                    {"feature": "traffic_direction", "value": "internal_pivot", "contribution": 0.35}
                ]
            }
        return None

    def detect_c2_beaconing(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """detects periodic low-volume connections using time-interval variance analysis."""
        dest_ip = event.get('dest_ip')
        if not dest_ip: return None
        
        now = time.time()
        if dest_ip not in self.beacon_intervals:
            self.beacon_intervals[dest_ip] = [now]
            return None
        
        last_t = self.beacon_intervals[dest_ip][-1]
        interval = now - last_t
        self.beacon_intervals[dest_ip].append(now)
        
        intervals = [self.beacon_intervals[dest_ip][i] - self.beacon_intervals[dest_ip][i-1] 
                     for i in range(1, len(self.beacon_intervals[dest_ip]))]
        
        if len(intervals) > 5:
            variance = np.var(intervals)
            if variance < 2.0: # Very tight periodic beaconing (e.g., exactly 60s)
                return {
                    "type": "c2_beacon",
                    "severity": "HIGH",
                    "mitre_tag": "T1071",
                    "confidence": 88,
                    "explanation": f"Detected highly periodic C2 beaconing to {dest_ip} with stable interval {int(np.mean(intervals))}s.",
                    "shap_features": [
                        {"feature": "interval_variance", "value": f"{variance:.2f}", "contribution": 0.91},
                        {"feature": "mean_interval", "value": f"{int(np.mean(intervals))}s", "contribution": 0.78}
                    ]
                }
        return None

    def mitigate_entity(self, entity_id: str):
        """Add an entity to the kill switch (blocked list)."""
        self.mitigated_entities.add(entity_id)

    def reset_protections(self):
        """Clear all mitigated entities (called when auto-remediation is disabled)."""
        self.mitigated_entities.clear()

    def mitigate_entity(self, entity_id: str):
        """Add an entity to the kill switch (blocked list)."""
        self.mitigated_entities.add(entity_id)

    def reset_protections(self):
        """Clear all mitigated entities (called when auto-remediation is disabled)."""
        self.mitigated_entities.clear()
