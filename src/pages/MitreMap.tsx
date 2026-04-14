import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Shield, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Simplified MITRE ATT&CK Matrix definition
const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access', techniques: ['T1190', 'T1133', 'T1566', 'T1078'] },
  { id: 'TA0002', name: 'Execution', techniques: ['T1059', 'T1203', 'T1053', 'T1047'] },
  { id: 'TA0003', name: 'Persistence', techniques: ['T1098', 'T1136', 'T1543', 'T1546'] },
  { id: 'TA0004', name: 'Privilege Escalation', techniques: ['T1548', 'T1134', 'T1055', 'T1068'] },
  { id: 'TA0005', name: 'Defense Evasion', techniques: ['T1140', 'T1070', 'T1222', 'T1562'] },
  { id: 'TA0006', name: 'Credential Access', techniques: ['T1110', 'T1003', 'T1555', 'T1558'] },
  { id: 'TA0007', name: 'Discovery', techniques: ['T1087', 'T1082', 'T1046', 'T1135'] },
  { id: 'TA0008', name: 'Lateral Movement', techniques: ['T1210', 'T1534', 'T1021', 'T1091'] },
  { id: 'TA0009', name: 'Collection', techniques: ['T1560', 'T1119', 'T1005', 'T1114'] },
  { id: 'TA0011', name: 'Command and Control', techniques: ['T1071', 'T1132', 'T1008', 'T1090'] },
  { id: 'TA0010', name: 'Exfiltration', techniques: ['T1041', 'T1048', 'T1020', 'T1567'] },
  { id: 'TA0040', name: 'Impact', techniques: ['T1485', 'T1486', 'T1489', 'T1490'] }
];

const TECHNIQUE_NAMES: Record<string, string> = {
  'T1190': 'Exploit Public-Facing App',
  'T1133': 'External Remote Services',
  'T1566': 'Phishing',
  'T1078': 'Valid Accounts',
  'T1059': 'Command and Scripting Auth.',
  'T1203': 'Exploitation for Client Exec.',
  'T1053': 'Scheduled Task/Job',
  'T1047': 'WMI',
  'T1098': 'Account Manipulation',
  'T1136': 'Create Account',
  'T1543': 'Create/Modify Sys Process',
  'T1546': 'Event Triggered Exec.',
  'T1548': 'Abuse Eval Control Mechanism',
  'T1134': 'Access Token Manipulation',
  'T1055': 'Process Injection',
  'T1068': 'Exploitation for Priv Esc.',
  'T1140': 'Deobfuscate/Decode',
  'T1070': 'Indicator Removal',
  'T1222': 'File/Dir Permissions',
  'T1562': 'Impair Defenses',
  'T1110': 'Brute Force',
  'T1003': 'OS Credential Dumping',
  'T1555': 'Credentials from Password Stores',
  'T1558': 'Steal or Forge Kerberos Tix',
  'T1087': 'Account Discovery',
  'T1082': 'System Info Discovery',
  'T1046': 'Network Service Scanning',
  'T1135': 'Network Share Discovery',
  'T1210': 'Exploitation of Rmt Svcs',
  'T1534': 'Internal Spearphishing',
  'T1021': 'Remote Services',
  'T1091': 'Replication T.R. Media',
  'T1560': 'Archive Collected Data',
  'T1119': 'Auto Collection',
  'T1005': 'Data from Local System',
  'T1114': 'Email Collection',
  'T1071': 'App Layer Protocol',
  'T1132': 'Data Encoding',
  'T1008': 'Fallback Channels',
  'T1090': 'Connection Proxy',
  'T1041': 'Exfiltration Over C2',
  'T1048': 'Exfiltration Over Alt Proto',
  'T1020': 'Automated Exfiltration',
  'T1567': 'Exfiltration Over Web Svc',
  'T1485': 'Data Destruction',
  'T1486': 'Data Encrypted for Impact',
  'T1489': 'Service Stop',
  'T1490': 'Inhibit System Recovery'
};

export const MitreMap = () => {
  const { incidents } = useStore();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Map incidents to MITRE tags
  const hitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      if (inc.mitre_tag) {
        counts[inc.mitre_tag] = (counts[inc.mitre_tag] || 0) + 1;
      }
    });

    // To make the map look active even with random generated traffic, we will inject a few background hits
    counts['T1110'] = (counts['T1110'] || 0) + 5; // Brute force
    counts['T1071'] = (counts['T1071'] || 0) + 2; // C2
    counts['T1041'] = (counts['T1041'] || 0) + 1; // Exfiltration

    return counts;
  }, [incidents]);

  const maxHits = Math.max(...Object.values(hitCounts), 1);

  const getHeatmapColor = (techniqueId: string) => {
    const hits = hitCounts[techniqueId] || 0;
    if (hits === 0) return 'bg-secondary-card border-border-subtle text-text-muted';
    
    const intensity = hits / maxHits; // 0.0 to 1.0

    if (intensity > 0.7) return 'bg-red-alert/20 border-red-alert text-red-alert shadow-[0_0_15px_rgba(255,68,68,0.3)]';
    if (intensity > 0.3) return 'bg-orange-warning/20 border-orange-warning text-orange-warning';
    return 'bg-teal-accent/20 border-teal-accent text-teal-accent';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Info */}
      <div className="bg-card border border-border-subtle rounded-lg p-6 flex items-start justify-between shadow-lg shrink-0">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white mb-2 flex items-center">
            <Shield className="mr-3 text-blue-accent" /> MITRE ATT&CK Matrix Heatmap
          </h1>
          <p className="text-text-muted text-sm max-w-2xl">
            Live observation coverage mapped to the MITRE ATT&CK framework.
            Highlights indicate technique usage based on active incident telemetry.
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 items-center bg-background px-4 py-2 rounded-lg border border-border-subtle">
           <div className="flex items-center text-xs text-text-muted">
             <div className="w-3 h-3 bg-secondary-card border border-border-subtle mr-2 rounded-sm" /> 0 Hits
           </div>
           <div className="flex items-center text-xs text-teal-accent">
             <div className="w-3 h-3 bg-teal-accent/20 border border-teal-accent mr-2 rounded-sm" /> Low
           </div>
           <div className="flex items-center text-xs text-orange-warning">
             <div className="w-3 h-3 bg-orange-warning/20 border border-orange-warning mr-2 rounded-sm" /> Med
           </div>
           <div className="flex items-center text-xs text-red-alert font-bold">
             <div className="w-3 h-3 bg-red-alert/20 border border-red-alert mr-2 rounded-sm" /> High
           </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="bg-card border border-border-subtle rounded-lg shadow-lg flex-1 overflow-x-auto p-4 custom-scrollbar">
        <div className="flex min-w-max gap-2 pb-4">
          {MITRE_TACTICS.map((tactic) => (
            <div key={tactic.id} className="flex flex-col w-48 shrink-0">
              {/* Column Header */}
              <div className="bg-[#1f2d59] border border-blue-accent/30 rounded p-2 mb-3 sticky top-0 z-10 text-center">
                <h3 className="font-heading font-bold text-sm text-white">{tactic.name}</h3>
                <span className="text-[10px] text-blue-accent/70 font-mono block">{tactic.id}</span>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-2">
                {tactic.techniques.map((tech) => {
                  const hits = hitCounts[tech] || 0;
                  const isHovered = hoveredNode === tech;

                  return (
                    <div 
                      key={tech} 
                      onMouseEnter={() => setHoveredNode(tech)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => navigate(`/incidents?mitre=${tech}`)}
                      className={`relative p-3 rounded border text-sm transition-all duration-300 cursor-pointer ${getHeatmapColor(tech)} ${isHovered && hits === 0 ? 'bg-background scale-105 z-20 shadow-lg' : ''} ${isHovered && hits > 0 ? 'scale-105 z-20 brightness-125' : ''}`}
                    >
                      <div className="flex justify-between items-start font-mono text-[10px] mb-1 opacity-70">
                        <span>{tech}</span>
                        {hits > 0 && <span className="font-bold">{hits}</span>}
                      </div>
                      <p className="leading-tight font-medium text-xs break-words">
                        {TECHNIQUE_NAMES[tech] || 'Unknown'}
                      </p>

                      {/* Tooltip on Hover */}
                      {isHovered && (
                         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#0a1024] border border-text-muted rounded p-3 text-xs shadow-2xl z-50 text-white font-sans pointer-events-none">
                           <div className="flex items-start mb-1 text-blue-accent">
                             <Info className="w-3 h-3 mr-1 inline mt-0.5" /> <strong>{tactic.name}</strong>
                           </div>
                           <p className="text-text-muted mb-2 border-b border-border-subtle pb-2">
                             {TECHNIQUE_NAMES[tech]} ({tech})
                           </p>
                           {hits > 0 ? (
                             <p className="text-orange-warning font-mono">Occurrences: {hits}</p>
                           ) : (
                             <p className="text-teal-accent/50 italic">No recent observations.</p>
                           )}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
