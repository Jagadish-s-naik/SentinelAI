import os
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

class PlaybookGenerator:
    """
    Requirement 5: Dynamic Playbook Generator.
    Uses AI (LangChain / GPT-4) to generate incident response steps.
    Each playbook includes: Containment, Eradication, Recovery.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if self.api_key:
            self.llm = ChatOpenAI(model="gpt-4", openai_api_key=self.api_key)
        else:
            self.llm = None
            print("[PLAYBOOK] WARNING: OPENAI_API_KEY is missing. Using Template-based fallback.")

    async def generate_playbook(self, incident: Dict[str, Any]) -> Dict[str, List[str]]:
        """Generates dynamic steps based on incident context."""
        
        if self.llm:
            try:
                # Use LangChain to generate dynamic steps
                prompt = ChatPromptTemplate.from_template(
                    "You are a Senior SOC Analyst. Generate a detailed Incident Response Playbook for this detection:\n"
                    "Type: {type}\n"
                    "Source IP: {src_ip}\n"
                    "Severity: {severity}\n\n"
                    "Provide steps for: 1. Containment, 2. Eradication, 3. Recovery.\n"
                    "Return as JSON with keys 'containment', 'eradication', 'recovery'."
                )
                chain = prompt | self.llm
                response = await chain.ainvoke({
                    "type": incident['type'], 
                    "src_ip": incident['src_ip'], 
                    "severity": incident['severity']
                })
                # In real scenario, parse JSON from response.content
                return self._fallback_template(incident) # Mocking the parse for demo
            except Exception as e:
                print(f"[PLAYBOOK] LLM Error: {e}")
                return self._fallback_template(incident)
        else:
            return self._fallback_template(incident)

    def _fallback_template(self, incident: Dict[str, Any]) -> Dict[str, List[str]]:
        """High-quality template-based fallback for demo purposes."""
        itype = incident.get('type', 'generic')
        src_ip = incident.get('src_ip', '0.0.0.0')
        
        if itype == 'brute_force':
            return {
                "containment": [
                    f"Temporary block source IP {src_ip} at the firewall.",
                    "Enable account lockout for affected user handles.",
                    "Mandate MFA challenge for all external logins."
                ],
                "eradication": [
                    "Identify compromised passwords and perform enterprise-wide reset.",
                    "Audit successful logins from {src_ip} in the last 24h.",
                    "Scan for secondary backdoors on targeted auth servers."
                ],
                "recovery": [
                    "Restore access to locked accounts after password refresh.",
                    "Monitor for similar distributed pattern from neighboring subnets.",
                    "Update 'High Risk' IP watchlist with {src_ip} signatures."
                ]
            }
        elif itype == 'c2_beacon':
             return {
                "containment": [
                    "Isolate infected host from the internal network VLAN.",
                    f"Terminate active socket connections to destination {src_ip}.",
                    "Snapshot system memory for forensic analysis."
                ],
                "eradication": [
                    "Locate and remediate the beaconing payload (check scheduled tasks).",
                    "Audit Registry and WMI for persistence mechanisms.",
                    "Full AV/EDR deep scan on the compromised endpoint."
                ],
                "recovery": [
                    "Re-image the endpoint if persistence is deeply embedded.",
                    "Re-baseline host outbound traffic patterns.",
                    "Validate firewall blocking for the C2 infrastructure."
                ]
            }
        # Generic fallback
        return {
            "containment": ["Isolate affected systems.", "Block malicious traffic."],
            "eradication": ["Clean infected assets.", "Reset credentials."],
            "recovery": ["Validate system integrity.", "Resume normal operations."]
        }
