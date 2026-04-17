import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Shield, AlertTriangle, Activity, Target, X, ChevronRight, ExternalLink, Download, Zap, TrendingUp, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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
  const [focusedTactic, setFocusedTactic] = useState<string | null>(null);
  const [lastIncidentId, setLastIncidentId] = useState<string | null>(null);
  const [pulseNode, setPulseNode] = useState<string | null>(null);

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

  const maxHits = Math.max(...Object.values(hitCounts), 1);

  // Derive related techniques based on active incidents
  const relatedTechniques = useMemo(() => {
    if (!selectedTechnique) return new Set<string>();
    
    const related = new Set<string>();
    // Simple logic: if techniques appear in the same incident or adjacent tactics
    const activeIncidents = incidents.filter(inc => inc.mitre_tag === selectedTechnique);
    activeIncidents.forEach(inc => {
      // Find other techniques in the same 'chain' (simulated context)
      // For now, we'll just link to other active tags in the store
      incidents.slice(0, 5).forEach(i => {
         if (i.mitre_tag && i.mitre_tag !== selectedTechnique) {
           related.add(i.mitre_tag);
         }
      });
    });
    return related;
  }, [selectedTechnique, incidents]);

  // Track new incidents for pulsing animation
  useEffect(() => {
    if (incidents.length > 0) {
      const latest = incidents[0];
      if (latest.id !== lastIncidentId) {
        setLastIncidentId(latest.id);
        if (latest.mitre_tag) {
          setPulseNode(latest.mitre_tag);
          const timer = setTimeout(() => setPulseNode(null), 3000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [incidents, lastIncidentId]);

  const stats = useMemo(() => {
    const totalTechniques = Object.keys(hitCounts).length;
    const criticalHits = incidents.filter(inc => inc.severity === 'CRITICAL').length;
    
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

  const getHeatColor = (tech: string) => {
    const hits = hitCounts[tech] || 0;
    if (hits === 0) return 'rgba(148, 163, 184, 0.1)'; // muted
    const intensity = hits / maxHits;
    if (intensity > 0.7) return 'rgba(239, 68, 68, 0.4)'; // red-alert
    if (intensity > 0.3) return 'rgba(245, 158, 11, 0.4)'; // orange-warning
    return 'rgba(20, 184, 166, 0.4)'; // teal-accent
  };

  const getBorderColor = (tech: string) => {
    const hits = hitCounts[tech] || 0;
    if (hits === 0) return 'rgba(255, 255, 255, 0.05)';
    const intensity = hits / maxHits;
    if (intensity > 0.7) return '#ef4444';
    if (intensity > 0.3) return '#f59e0b';
    return '#14b8a6';
  };

  const selectedIncidents = useMemo(() => {
    if (!selectedTechnique) return [];
    return incidents.filter(inc => inc.mitre_tag === selectedTechnique);
  }, [selectedTechnique, incidents]);

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

  return (
    <div className="flex h-full space-x-6 overflow-hidden bg-[#050b18]">
      
      <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
        
        {/* Kinetic Header */}
        <div className="shrink-0 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-1 h-4 bg-blue-accent rounded-full animate-pulse" />
                <h1 className="text-2xl font-heading font-black text-white tracking-tight flex items-center">
                  MITRE <span className="text-blue-accent ml-2">KINETIC</span> MATRIX
                </h1>
              </div>
              <p className="text-text-muted text-sm font-medium">
                Autonomous behavior mapping & multi-vector threat tracing.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
               <div className="flex bg-card/40 backdrop-blur-md border border-white/5 rounded-lg p-1">
                  <button 
                    onClick={() => setFocusedTactic(null)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${!focusedTactic ? 'bg-blue-accent text-white' : 'text-text-muted hover:text-white'}`}
                  >
                    FULL_MATRIX
                  </button>
                  <button 
                    disabled={!selectedTechnique}
                    onClick={() => {
                        if (selectedTechnique) {
                            const tactic = MITRE_TACTICS.find(t => t.techniques.includes(selectedTechnique));
                            if (tactic) setFocusedTactic(tactic.id);
                        }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${focusedTactic && selectedTechnique && MITRE_TACTICS.find(t => t.id === focusedTactic)?.techniques.includes(selectedTechnique) ? 'bg-blue-accent text-white' : 'text-text-muted hover:text-white'}`}
                  >
                    FOCUS_CHAIN
                  </button>
               </div>
               <button 
                onClick={exportHeatmap}
                className="p-2.5 bg-blue-accent/10 border border-blue-accent/20 text-blue-accent hover:bg-blue-accent hover:text-white rounded-xl transition-all shadow-lg group"
               >
                <Download className="w-4 h-4 group-hover:scale-110" />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Intelligence Coverage', value: '94.2%', icon: Monitor, color: 'text-blue-accent' },
              { label: 'Observed Techniques', value: stats.totalTechniques, icon: Activity, color: 'text-teal-accent' },
              { label: 'Critical Path Hits', value: stats.criticalHits, icon: AlertTriangle, color: 'text-red-alert' },
              { label: 'Peak Activation', value: stats.mostActiveTactic.split(' ')[0], icon: Target, color: 'text-orange-warning' }
            ].map((s, i) => (
              <div key={i} className="bg-card/30 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center space-x-4 shadow-xl">
                 <div className={`p-2.5 rounded-xl bg-background/50 border border-white/5 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">{s.label}</p>
                    <p className="text-lg font-black text-white">{s.value}</p>
                 </div>
              </div>
            ))}
          </div>

          {/* Intelligence Ticker */}
          <div className="bg-[#0a1229]/80 backdrop-blur-md border-y border-white/5 h-8 flex items-center overflow-hidden relative">
             <div className="absolute left-0 h-full w-24 bg-gradient-to-r from-[#050b18] to-transparent z-10 flex items-center pl-4">
                <Zap className="w-3 h-3 text-blue-accent animate-pulse mr-2" />
                <span className="text-[9px] font-black text-blue-accent uppercase">Live_Feed</span>
             </div>
             <motion.div 
               animate={{ x: [1000, -2000] }}
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="whitespace-nowrap flex space-x-12"
             >
                {incidents.slice(0, 10).map((inc, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="text-[10px] text-text-muted font-mono">[{format(new Date(inc.timestamp), 'HH:mm:ss')}]</span>
                    <span className="text-[10px] text-white font-bold">{inc.severity} Hit:</span>
                    <span className="text-[10px] text-blue-accent underline cursor-pointer">{inc.mitre_tag || 'Unknown'}</span>
                    <ChevronRight className="w-3 h-3 text-text-muted" />
                  </div>
                ))}
             </motion.div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="flex-1 bg-card/20 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative group/matrix">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-accent/5 via-transparent to-red-alert/5 pointer-events-none" />
          
          {/* Focus Mode Overlay */}
          <AnimatePresence>
            {focusedTactic && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-[#050b18]/40 backdrop-blur-[2px] pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Focus Indicator Banner */}
          <AnimatePresence>
            {focusedTactic && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-blue-accent/90 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_0_40px_rgba(45,108,223,0.5)] flex items-center space-x-3 pointer-events-auto cursor-pointer"
                onClick={() => setFocusedTactic(null)}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Focus Mode Active: {MITRE_TACTICS.find(t => t.id === focusedTactic)?.name}</span>
                <X className="w-3 h-3 text-white/70 hover:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-full overflow-x-auto p-8 custom-scrollbar relative z-10">
            <LayoutGroup>
              <div className="flex min-w-max gap-6 items-start">
                {MITRE_TACTICS.map((tactic) => {
                  const isFocused = focusedTactic === tactic.id || !focusedTactic;
                  const tacticHits = tactic.techniques.reduce((sum, tech) => sum + (hitCounts[tech] || 0), 0);
                  
                  return (
                    <motion.div 
                      key={tactic.id} 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: isFocused ? 1 : 0.2, 
                        y: 0,
                        filter: isFocused ? 'blur(0px)' : 'blur(8px)',
                        scale: isFocused ? 1 : 0.95,
                        zIndex: isFocused ? 45 : 1
                      }}
                      className="flex flex-col w-56 shrink-0 group/column relative transition-all duration-700"
                    >
                      {!isFocused && (
                        <div className="absolute inset-0 z-50 cursor-pointer" onClick={() => setFocusedTactic(tactic.id)} />
                      )}
                      <div 
                        onClick={() => setFocusedTactic(focusedTactic === tactic.id ? null : tactic.id)}
                        className={`bg-[#0a1229]/90 backdrop-blur-xl border-l-2 ${tacticHits > 0 ? 'border-blue-accent' : 'border-white/5'} rounded-r-xl p-4 mb-6 sticky top-0 z-20 cursor-pointer hover:bg-blue-accent/5 transition-all group`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-heading font-black text-[11px] text-white uppercase tracking-widest">{tactic.name}</h3>
                          {tacticHits > 0 && <span className="w-1.5 h-1.5 bg-blue-accent rounded-full animate-ping" />}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-blue-accent font-mono font-bold tracking-widest">{tactic.id}</span>
                          <span className="text-[10px] text-text-muted font-bold">{tacticHits} <span className="opacity-50 tracking-tighter">EVENTS</span></span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {tactic.techniques.map((tech) => {
                          const hits = hitCounts[tech] || 0;
                          const isHovered = hoveredNode === tech;
                          const isSelected = selectedTechnique === tech;
                          const isRelated = relatedTechniques.has(tech);
                          const isPulsing = pulseNode === tech;

                          return (
                            <motion.div 
                              key={tech}
                              layoutId={`node-${tech}`}
                              onMouseEnter={() => setHoveredNode(tech)}
                              onMouseLeave={() => setHoveredNode(null)}
                              onClick={() => setSelectedTechnique(tech)}
                              animate={isPulsing ? {
                                boxShadow: ['0 0 0px #fff', '0 0 20px #fff', '0 0 0px #fff'],
                                scale: [1, 1.05, 1],
                              } : {}}
                              className={`
                                relative p-4 rounded-2xl border transition-all duration-500 cursor-pointer group/card
                                ${isSelected ? 'ring-2 ring-blue-accent z-30 shadow-[0_0_30px_rgba(45,108,223,0.3)]' : ''}
                                ${isHovered ? 'scale-[1.05] z-20 shadow-2xl brightness-125' : ''}
                                ${isRelated ? 'ring-2 ring-blue-accent/30 scale-[1.02] border-blue-accent/50' : ''}
                              `}
                              style={{ 
                                background: isHovered || isSelected ? 
                                  `linear-gradient(135deg, ${getHeatColor(tech)}, rgba(10, 18, 41, 0.9)) ` : 
                                  `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(10, 18, 41, 0.95))`,
                                borderColor: isSelected || isHovered ? getBorderColor(tech) : 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(16px)',
                                boxShadow: isHovered ? `0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)` : 'none'
                              }}
                            >
                               {/* Depth & Highlights */}
                               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                               <div className="absolute inset-[1px] bg-gradient-to-tl from-transparent via-transparent to-white/5 rounded-[15px] pointer-events-none" />
                               
                               {/* Scanning Line Animation on Hover */}
                               {isHovered && (
                                 <motion.div 
                                    initial={{ top: '0%' }}
                                    animate={{ top: '100%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                    className="absolute left-0 right-0 h-[1px] bg-white/20 z-0 pointer-events-none"
                                 />
                               )}
                               
                               <div className="flex justify-between items-start mb-3 relative z-10">
                                 <div className="px-2 py-0.5 bg-black/30 rounded-md border border-white/5">
                                   <span className="font-mono text-[9px] text-white opacity-80 tracking-widest">{tech}</span>
                                 </div>
                                 {hits > 0 && (
                                   <div className="flex items-center space-x-1">
                                     <TrendingUp className="w-3 h-3 text-white" />
                                     <span className="font-black text-[10px] text-white">{hits}</span>
                                   </div>
                                 )}
                               </div>

                               <p className="leading-tight font-black text-[12px] text-white mb-2 min-h-[30px] line-clamp-2 relative z-10 group-hover/card:text-blue-accent transition-colors">
                                 {TECHNIQUE_NAMES[tech] || 'Unknown'}
                               </p>

                               {/* Path Tracer Animated Edge (if selected) */}
                               {isSelected && (
                                 <motion.div 
                                   layoutId="path-tracer"
                                   className="absolute -right-6 top-1/2 w-6 h-px bg-gradient-to-r from-blue-accent to-transparent z-0"
                                   initial={{ scaleX: 0 }}
                                   animate={{ scaleX: 1 }}
                                 />
                               )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        </div>
      </div>

      {/* Modern Perspective Sidebar */}
      <AnimatePresence>
        {selectedTechnique && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-[420px] bg-[#0a1229]/95 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col shrink-0 z-[100] relative"
          >
            {/* Glossy Header */}
            <div className="p-8 border-b border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Shield className="w-32 h-32 text-blue-accent rotate-12" />
               </div>
               
               <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                       <Zap className="w-4 h-4 text-blue-accent" />
                       <span className="text-[10px] font-black text-blue-accent uppercase tracking-[0.3em]">Behavior_Analysis</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight mt-2 italic">
                      {TECHNIQUE_NAMES[selectedTechnique]}
                    </h2>
                    <p className="text-xs text-text-muted font-mono">{selectedTechnique}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedTechnique(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all group"
                  >
                    <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest">Technique Context</h3>
                  <a 
                    href={`https://attack.mitre.org/techniques/${selectedTechnique}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-accent hover:underline flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" /> MITRE_DOCS
                  </a>
                </div>
                <div className="bg-background/50 border border-white/5 rounded-2xl p-4">
                  <p className="text-xs text-text-muted leading-relaxed">
                    {TECHNIQUE_DESCRIPTIONS[selectedTechnique] || "Advanced behavioral monitoring is currently processing multi-stage detection signatures for this specific MITRE technique. Threat patterns are being cross-referenced with global intelligence feeds."}
                  </p>
                </div>
              </div>

              {/* Related Chain */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center">
                  <TrendingUp className="w-3 h-3 mr-2 text-teal-accent" /> Contextual Connections
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(relatedTechniques).map(tech => (
                    <div 
                      key={tech}
                      onClick={() => setSelectedTechnique(tech)}
                      className="px-3 py-1.5 bg-blue-accent/5 border border-blue-accent/20 rounded-full text-[10px] font-bold text-blue-accent cursor-pointer hover:bg-blue-accent hover:text-white transition-all"
                    >
                      {tech}
                    </div>
                  ))}
                  {relatedTechniques.size === 0 && <span className="text-[10px] text-text-muted italic">No active chain detected...</span>}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Active Incident Stream</h4>
                  <div className="px-2 py-0.5 bg-red-alert/10 border border-red-alert/20 rounded text-[10px] font-black text-red-alert">
                    {selectedIncidents.length} EVENTS
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedIncidents.length > 0 ? (
                    selectedIncidents.map(inc => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={inc.id} 
                        onClick={() => navigate(`/incidents?id=${inc.id}`)}
                        className="p-4 bg-background border border-white/5 rounded-2xl hover:border-blue-accent/50 cursor-pointer transition-all group relative overflow-hidden"
                      >
                         <div className="absolute top-0 left-0 w-1 h-full bg-blue-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="flex justify-between items-center mb-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-tighter ${
                              inc.severity === 'CRITICAL' ? 'bg-red-alert/20 text-red-alert' :
                              inc.severity === 'HIGH' ? 'bg-orange-warning/20 text-orange-warning' :
                              'bg-teal-accent/20 text-teal-accent'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">{format(new Date(inc.timestamp), 'HH:mm:ss')}</span>
                         </div>
                         <p className="text-[11px] text-white font-bold mb-2 line-clamp-2">{inc.explanation}</p>
                         <div className="flex items-center text-[10px] text-blue-accent font-black tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">
                            INVESTIGATE_PATH <ChevronRight className="w-3 h-3 ml-1" />
                         </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-12 text-center bg-background/30 rounded-3xl border border-dashed border-white/5">
                       <Activity className="w-10 h-10 text-text-muted opacity-10 mx-auto mb-3" />
                       <p className="text-xs text-text-muted italic">Awaiting behavioral triggers...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#0a1229] border-t border-white/5">
               <button 
                onClick={() => navigate(`/incidents?mitre=${selectedTechnique}`)}
                className="w-full py-4 bg-blue-accent hover:bg-blue-accent/90 text-white rounded-2xl text-xs font-black tracking-[.2em] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(45,108,223,0.5)] group transition-all"
               >
                 LAUNCH_FORENSICS <ExternalLink className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
