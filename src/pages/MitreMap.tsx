import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Shield, Info, AlertTriangle, Activity, Target, X, ChevronRight, ExternalLink, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

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
  { id: 'TA0040', name: 'Impact', techniques: ['T1485', 'T1486', 'T1489', 'T1490', 'T1498'] }
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
  'T1490': 'Inhibit System Recovery',
  'T1498': 'Network Denial of Service'
};

const TECHNIQUE_DESCRIPTIONS: Record<string, string> = {
  'T1110': 'Adversaries may use brute force techniques to gain access to accounts when passwords or other authentication factors are unknown.',
  'T1071': 'Adversaries may communicate using application layer protocols to avoid detection/network filtering by blending in with existing traffic.',
  'T1048': 'Adversaries may exfiltrate data using an alternate network protocol other than the main command and control channel.',
  'T1486': 'Adversaries may render stored data inaccessible by encrypting it and withholding access to a decryption key (Ransomware).',
  'T1498': 'Adversaries may stage a network denial of service (DoS) attack to degrade or shut down the availability of a service.',
  'T1087': 'Adversaries may attempt to get a listing of local system or domain accounts.'
};

export const MitreMap = () => {
  const { incidents } = useStore();
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [lastIncidentId, setLastIncidentId] = useState<string | null>(null);
  const [pulseNode, setPulseNode] = useState<string | null>(null);

  const exportHeatmap = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats: stats,
      heatMap: MITRE_TACTICS.map(t => ({
        tacticId: t.id,
        tacticName: t.name,
        techniques: t.techniques.map(tech => ({
          id: tech,
          name: TECHNIQUE_NAMES[tech],
          hits: hitCounts[tech] || 0
        }))
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_mitre_export_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    link.click();
  };

  // Track new incidents for pulsing animation
  useEffect(() => {
    if (incidents.length > 0) {
      const latest = incidents[0];
      if (latest.id !== lastIncidentId) {
        setLastIncidentId(latest.id);
        if (latest.mitre_tag) {
          setPulseNode(latest.mitre_tag);
          const timer = setTimeout(() => setPulseNode(null), 2000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [incidents, lastIncidentId]);

  // Aggregate stats
  const hitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      if (inc.mitre_tag) {
        counts[inc.mitre_tag] = (counts[inc.mitre_tag] || 0) + 1;
      }
    });
    return counts;
  }, [incidents]);

  const stats = useMemo(() => {
    const totalTechniques = Object.keys(hitCounts).length;
    const criticalHits = incidents.filter(inc => inc.severity === 'CRITICAL').length;
    
    // Find most active tactic
    const tacticCounts: Record<string, number> = {};
    MITRE_TACTICS.forEach(t => {
      let count = 0;
      t.techniques.forEach(tech => {
        count += (hitCounts[tech] || 0);
      });
      tacticCounts[t.name] = count;
    });
    
    const mostActiveTactic = Object.entries(tacticCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0]);

    return { totalTechniques, criticalHits, mostActiveTactic: mostActiveTactic[0] };
  }, [hitCounts, incidents]);

  const maxHits = Math.max(...Object.values(hitCounts), 1);

  const getHeatmapColor = (techniqueId: string) => {
    const hits = hitCounts[techniqueId] || 0;
    if (hits === 0) return 'bg-secondary-card border-border-subtle text-text-muted';
    
    const intensity = hits / maxHits;
    if (intensity > 0.7) return 'bg-red-alert/20 border-red-alert text-red-alert shadow-[0_0_15px_rgba(255,68,68,0.3)]';
    if (intensity > 0.3) return 'bg-orange-warning/20 border-orange-warning text-orange-warning';
    return 'bg-teal-accent/20 border-teal-accent text-teal-accent';
  };

  const selectedIncidents = useMemo(() => {
    if (!selectedTechnique) return [];
    return incidents.filter(inc => inc.mitre_tag === selectedTechnique);
  }, [selectedTechnique, incidents]);

  return (
    <div className="flex h-full space-x-6 overflow-hidden">
      
      <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
        {/* Header & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
          <div className="lg:col-span-2 bg-card border border-border-subtle rounded-xl p-6 shadow-lg flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-heading font-bold text-white mb-2 flex items-center">
                <Shield className="mr-3 text-blue-accent" /> MITRE ATT&CK Matrix Heatmap
              </h1>
              <p className="text-text-muted text-sm max-w-xl">
                Live observation coverage mapped to the MITRE ATT&CK framework.
                Highlights indicate real-time technique usage based on active telemetry.
              </p>
            </div>
            <button 
              onClick={exportHeatmap}
              className="px-4 py-2 bg-blue-accent/10 border border-blue-accent/30 text-blue-accent hover:bg-blue-accent hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 group shrink-0"
            >
              <Download className="w-4 h-4 group-hover:animate-bounce" /> DOWNLOAD_INTEL
            </button>
          </div>

          <div className="bg-card border border-border-subtle rounded-xl p-4 flex justify-between items-center shadow-lg">
             <div className="space-y-4 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted flex items-center"><Activity className="w-3 h-3 mr-1 text-teal-accent" /> Observed Techniques</span>
                  <span className="text-sm font-bold text-white bg-teal-accent/10 px-2 py-0.5 rounded border border-teal-accent/20">{stats.totalTechniques}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted flex items-center"><AlertTriangle className="w-3 h-3 mr-1 text-red-alert" /> Critical Hits</span>
                  <span className="text-sm font-bold text-red-alert bg-red-alert/10 px-2 py-0.5 rounded border border-red-alert/20">{stats.criticalHits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted flex items-center"><Target className="w-3 h-3 mr-1 text-blue-accent" /> Active Tactic</span>
                  <span className="text-xs font-bold text-blue-accent truncate max-w-[100px] text-right">{stats.mostActiveTactic}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="bg-card border border-border-subtle rounded-xl shadow-lg flex-1 overflow-x-auto p-4 custom-scrollbar">
          <div className="flex min-w-max gap-4 pb-4 items-start">
            {MITRE_TACTICS.map((tactic) => (
              <div key={tactic.id} className="flex flex-col w-52 shrink-0 group/column transition-all duration-300 hover:z-50">
                <div className="bg-[#1a2444] border border-blue-accent/30 rounded-lg p-3 mb-4 sticky top-0 z-10 text-center shadow-lg group-hover/column:border-blue-accent transition-colors">
                  <h3 className="font-heading font-bold text-xs text-white uppercase tracking-wider truncate px-1">{tactic.name}</h3>
                  <span className="text-[10px] text-blue-accent/70 font-mono block mt-0.5">{tactic.id}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {tactic.techniques.map((tech) => {
                    const hits = hitCounts[tech] || 0;
                    const isHovered = hoveredNode === tech;
                    const isSelected = selectedTechnique === tech;
                    const isPulsing = pulseNode === tech;

                    return (
                      <motion.div 
                        key={tech}
                        layoutId={`node-${tech}`}
                        onMouseEnter={() => setHoveredNode(tech)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedTechnique(tech)}
                        animate={isPulsing ? {
                          scale: [1, 1.05, 1],
                          brightness: [1, 1.5, 1],
                        } : {}}
                        className={`relative p-3 rounded-lg border text-sm transition-all duration-300 cursor-pointer ${isSelected ? 'ring-2 ring-blue-accent z-30' : ''} ${getHeatmapColor(tech)} ${isHovered ? 'scale-[1.03] z-20 brightness-110 shadow-xl' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-1.5 pt-0.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">{tech}</span>
                          {hits > 0 && (
                            <div className="flex items-center bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                              <Activity className="w-2.5 h-2.5 mr-1" />
                              <span className="font-bold text-[10px]">{hits}</span>
                            </div>
                          )}
                        </div>
                        <p className="leading-snug font-bold text-[11px] min-h-[32px] overflow-hidden line-clamp-2">
                          {TECHNIQUE_NAMES[tech] || 'Unknown Technique'}
                        </p>

                        {isPulsing && (
                          <motion.div 
                            layoutId={`pulse-ring-${tech}`}
                            className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none"
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1.3] }}
                            transition={{ duration: 1.5 }}
                          />
                        )}

                        <AnimatePresence>
                          {isHovered && !selectedTechnique && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -10, scale: 0.95 }}
                              className="absolute top-0 left-[calc(100%+12px)] p-5 bg-[#0d152b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] z-[100] text-white w-[280px] pointer-events-none before:content-[''] before:absolute before:top-6 before:-left-2 before:w-4 before:h-4 before:bg-[#0d152b] before:border-l before:border-b before:border-white/10 before:rotate-45"
                            >
                              <div className="relative z-10">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-1.5 h-6 bg-blue-accent rounded-full" />
                                  <span className="text-[10px] text-blue-accent uppercase font-black tracking-[0.2em]">Technique Detail</span>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed mb-4">
                                  {TECHNIQUE_DESCRIPTIONS[tech] || "Advanced behavioral monitoring is active for this MITRE technique, capturing multi-vector telemetry."}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                  <div className="flex items-center space-x-1.5">
                                    <Activity className={`w-3.5 h-3.5 ${hits > 0 ? 'text-teal-accent' : 'text-text-muted opacity-50'}`} />
                                    <span className={`text-xs font-bold ${hits > 0 ? 'text-teal-accent' : 'text-text-muted'}`}>
                                      {hits} {hits === 1 ? 'Hit' : 'Hits'}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-[10px] text-blue-accent font-bold">
                                    Click to investigate <ChevronRight className="w-3 h-3 ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Drawer for Selection Detail */}
      <AnimatePresence>
        {selectedTechnique && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-96 bg-card border-l border-border-subtle shadow-2xl flex flex-col shrink-0"
          >
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-[#0a1229]">
               <div>
                  <h2 className="text-lg font-heading font-bold text-white flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-accent" /> Technique Details
                  </h2>
                  <p className="text-xs text-blue-accent font-mono">{selectedTechnique}</p>
               </div>
               <button 
                onClick={() => setSelectedTechnique(null)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
               >
                 <X className="w-5 h-5 text-text-muted" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="space-y-2">
                <h3 className="text-md font-bold text-white">{TECHNIQUE_NAMES[selectedTechnique]}</h3>
                <p className="text-xs text-text-muted leading-relaxed italic">
                  {TECHNIQUE_DESCRIPTIONS[selectedTechnique] || "Analysis coverage includes real-time behavioral monitoring and multi-stage detection signatures for this specific MITRE technique."}
                </p>
                <a 
                  href={`https://attack.mitre.org/techniques/${selectedTechnique}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[10px] text-blue-accent hover:underline mt-2"
                >
                  <ExternalLink className="w-2 h-2 mr-1" /> Official MITRE Documentation
                </a>
              </div>

              <div className="space-y-4 pt-4 border-t border-border-subtle">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Related Incidents</h4>
                  <span className="text-[10px] bg-blue-accent/10 border border-blue-accent/20 px-2 py-0.5 rounded text-blue-accent">
                    {selectedIncidents.length} Match(es)
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedIncidents.length > 0 ? (
                    selectedIncidents.map(inc => (
                      <div 
                        key={inc.id} 
                        onClick={() => navigate(`/incidents?id=${inc.id}`)}
                        className="p-3 bg-background border border-border-subtle rounded-lg hover:border-blue-accent cursor-pointer transition-colors group"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              inc.severity === 'CRITICAL' ? 'bg-red-alert/10 text-red-alert border border-red-alert/30' :
                              inc.severity === 'HIGH' ? 'bg-orange-warning/10 text-orange-warning border border-orange-warning/30' :
                              'bg-teal-accent/10 text-teal-accent border border-teal-accent/30'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">{format(new Date(inc.timestamp), 'HH:mm:ss')}</span>
                         </div>
                         <p className="text-xs text-white font-medium mb-1 line-clamp-2">{inc.explanation}</p>
                         <div className="flex items-center text-[10px] text-blue-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            Investigation <ChevronRight className="w-2 h-2 ml-1" />
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center bg-background/50 rounded-lg border border-dashed border-border-subtle">
                       <Activity className="w-8 h-8 text-text-muted opacity-20 mx-auto mb-2" />
                       <p className="text-xs text-text-muted italic">No active incidents detected for this technique in the current window.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-background border-t border-border-subtle">
               <button 
                onClick={() => navigate(`/incidents?mitre=${selectedTechnique}`)}
                className="w-full py-3 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-lg text-sm font-bold flex items-center justify-center shadow-[0_0_15px_rgba(45,108,223,0.3)]"
               >
                 View All in Incident List <ExternalLink className="w-4 h-4 ml-2" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
