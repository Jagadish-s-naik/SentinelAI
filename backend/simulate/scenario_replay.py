import asyncio
import time
import random
from datetime import datetime

class SentinelSimulator:
    """
    Requirement 6: Threat Simulation Mode.
    Replay attack scenarios against the detection engine.
    Scenario 1: Brute Force (distributed)
    Scenario 2: C2 Beacon (60s periodic)
    Scenario 3: Admin Transfer (False Positive)
    """

    def __init__(self, log_path: str = "logs/sentinel.log"):
        self.log_path = log_path

    def write_log(self, message: str):
        with open(self.log_path, "a") as f:
            f.write(f"[{datetime.now().isoformat()}] {message}\n")

    async def run_scenario_brute_force(self):
        """Scenario 1: Distributed Brute Force on Login Endpoint."""
        print("[SIMULATOR] Starting Scenario 1: Distributed Brute Force")
        ips = [f"192.168.1.{i}" for i in range(10, 20)]
        for _ in range(30):
            ip = random.choice(ips)
            self.write_log(f"IP: {ip} | USER: admin | ACTION: LOGIN_FAILURE | AREA: AUTH_SRV")
            await asyncio.sleep(random.uniform(0.1, 0.5))
        print("[SIMULATOR] Scenario 1 Complete")

    async def run_scenario_c2_beacon(self, duration_sec: int = 300):
        """Scenario 2: C2 Beacon - 60s interval low-volume pings."""
        print("[SIMULATOR] Starting Scenario 2: C2 Beacon (60s interval)")
        dest_ip = "45.18.29.102"
        start_time = time.time()
        while time.time() - start_time < duration_sec:
            self.write_log(f"IP: 10.0.0.5 | DEST_IP: {dest_ip} | ACTION: PING | BYTES: 64")
            await asyncio.sleep(10) # Using 10s for demo speed instead of 60s
        print("[SIMULATOR] Scenario 2 Complete")

    async def run_scenario_admin_fp(self):
        """Scenario 3: Admin Bulk Data Transfer (False Positive)."""
        print("[SIMULATOR] Starting Scenario 3: Admin Data Transfer (False Positive)")
        self.write_log(f"IP: 10.0.5.1 | USER: admin_hk | ACTION: DATA_EXPORT | SIZE: 4500MB")
        await asyncio.sleep(1)
        print("[SIMULATOR] Scenario 3 Complete")

    async def seed_dataset_patterns(self):
        """Requirement 7: Seed patterns from CICIDS/UNSW logic."""
        # PortScan Pattern (CICIDS)
        for port in range(20, 100):
            self.write_log(f"IP: 172.16.0.10 | ACTION: PORT_SCAN | PORT: {port}")
            await asyncio.sleep(0.01)

if __name__ == "__main__":
    sim = SentinelSimulator()
    asyncio.run(sim.run_scenario_brute_force())
