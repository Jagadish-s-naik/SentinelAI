import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

class SentinelNormalizer:
    """
    Requirement 2: Normalization Layer.
    Unified Event Schema with consistent field mapping across all log sources.
    Includes deduplication of events before passing to detection engine.
    """
    
    def __init__(self):
        self.processed_hashes = set()
        # In a real system, this would be a sliding window or Redis-based TTL cache
        self.dedup_window_size = 1000 

    def generate_event_id(self, event_data: Dict[str, Any]) -> str:
        """Generates a unique deterministic ID based on event content for deduplication."""
        # Focus on stable fields for deduplication
        dedup_keys = ['src_ip', 'dest_ip', 'user', 'action', 'layer', 'event_type']
        content = "|".join([str(event_data.get(k, "")) for k in dedup_keys])
        return hashlib.sha256(content.encode()).hexdigest()

    def normalize(self, raw_log: str, layer: str) -> Optional[Dict[str, Any]]:
        """
        Parses raw logs into the Unified JSON Event Schema.
        Ingest: Network Flow, Endpoint, HTTP/API Logs
        """
        try:
            # Basic parser logic (will be extended based on actual log formats)
            # Unified Event Schema:
            # timestamp, layer, event_type, src_ip, dest_ip, user, action, data, metadata
            
            # Simulated parsing of standard [TIMESTAMP] log format
            timestamp = datetime.now().isoformat() if "[" not in raw_log else raw_log.split("]")[0][1:]
            
            event = {
                "timestamp": timestamp,
                "layer": layer,
                "schema_version": "2.0",
                "ingested_at": datetime.now().isoformat()
            }

            # 1. Base mapping (Common across all layers)
            if "IP:" in raw_log:
                event["src_ip"] = raw_log.split("IP: ")[1].split(" ")[0]
            if "ACTION:" in raw_log:
                event["action"] = raw_log.split("ACTION: ")[1].split(" ")[0]
            if "USER:" in raw_log:
                event["user"] = raw_log.split("USER: ")[1].split(" ")[0]

            if layer == "network":
                event["event_type"] = "NET_FLOW"
                if "DEST_IP:" in raw_log:
                    event["dest_ip"] = raw_log.split("DEST_IP: ")[1].split(" ")[0]

            elif layer == "endpoint":
                event["event_type"] = "PROC_LOG"
                if "FILE:" in raw_log:
                    event["metadata"] = {"file_path": raw_log.split("FILE: ")[1].strip()}

            elif layer == "application":
                event["event_type"] = "API_LOG"
                if "DB_QUERY" in raw_log:
                    event["action"] = "DATABASE_QUERY"
                if "SIZE:" in raw_log:
                    event["metadata"] = {"size_mb": int(raw_log.split("SIZE: ")[1].split("MB")[0])}

            # Deduplication Check (Include timestamp to avoid dropping repeated login failures)
            # Actually, for brute force, we DO NOT want to deduplicate identical messages at different times
            event_hash = self.generate_event_id(event) + "_" + event["timestamp"]
            if event_hash in self.processed_hashes:
                return None # Skip absolute duplicate at the same microsecond
            
            self.processed_hashes.add(event_hash)
            # Maintain a reasonable cache size
            if len(self.processed_hashes) > self.dedup_window_size:
                # Convert to list and remove oldest half
                hashes_list = list(self.processed_hashes)
                self.processed_hashes = set(hashes_list[self.dedup_window_size // 2:])
                
            return event
            
        except Exception as e:
            print(f"Normalization failed for line: {raw_log}. Error: {e}")
            return None

if __name__ == "__main__":
    norm = SentinelNormalizer()
    sample = "[2024-04-17T09:00:00Z] IP: 192.168.1.50 | ACTION: ACCESS_GRANT"
    print(json.dumps(norm.normalize(sample, "network"), indent=2))
