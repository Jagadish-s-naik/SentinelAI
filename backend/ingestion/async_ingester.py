import asyncio
import os
import time
from typing import Callable, Coroutine
from backend.ingestion.normalizer import SentinelNormalizer

class AsyncSentinelIngester:
    """
    Requirement 1: Multi-Signal Data Ingestion.
    Uses Python asyncio for streaming ingestion of log files.
    Monitoring Network Flow, Endpoint, and HTTP/API logs.
    """
    
    def __init__(self, log_path: str, callback: Callable[[dict], Coroutine] = None):
        self.log_path = log_path
        self.normalizer = SentinelNormalizer()
        self.callback = callback
        self.is_running = False

    async def watch_file(self):
        """Monitors the log file for new entries using asyncio."""
        print(f"[INGESTER] Starting Async Watcher on: {self.log_path}")
        
        # Ensure file exists
        if not os.path.exists(self.log_path):
            os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
            with open(self.log_path, 'w') as f:
                pass

        last_pos = 0
        self.is_running = True
        
        while self.is_running:
            try:
                file_size = os.path.getsize(self.log_path)
                if file_size > last_pos:
                    with open(self.log_path, 'r') as f:
                        f.seek(last_pos)
                        lines = f.readlines()
                        last_pos = f.tell()
                        print(f"[INGESTER] Detected growth. Read {len(lines)} lines.")
                    
                    if lines:
                        print(f"[INGESTER] Read {len(lines)} lines from log.")
                    for line in lines:
                        line = line.strip()
                        if not line: continue
                        
                        # Determine layer
                        layer = 'network'
                        if 'USER:' in line or 'FILE:' in line: layer = 'endpoint'
                        if 'DB_QUERY' in line or 'STRESS_INGEST' in line: layer = 'application'
                        
                        normalized_event = self.normalizer.normalize(line, layer)
                        if normalized_event:
                            print(f"[INGESTER] Normalized event: {normalized_event.get('action')}")
                            if self.callback:
                                await self.callback(normalized_event)
            except Exception as e:
                print(f"[INGESTER] Error reading log: {e}")
                
            await asyncio.sleep(0.5)
            
    def stop(self):
        self.is_running = False

# Example usage (standalone test)
if __name__ == "__main__":
    async def process_event(event):
        # This will be replaced by the Detection Engine
        print(f"PIPELINE: Received event {event['event_type']}")

    log_file = "logs/sentinel.log"
    ingester = AsyncSentinelIngester(log_file, process_event)
    
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(ingester.watch_file())
    except KeyboardInterrupt:
        ingester.stop()
