import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Network, MonitorSmartphone, AppWindow, Skull, ShieldAlert, Cpu, Activity, Clock, ExternalLink, Database, Search, Info, Zap, RefreshCw, Download, X, Brain } from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow, subMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const FlowDiagram = React.memo(({ activeLayers = [] }: { activeLayers: string[] }) => {
  const isLayerActive = (layer: string) => activeLayers.includes(layer);

  return (
    <div className="bg-card border border-border-subtle p-8 rounded-xl shadow-2xl mb-6 flex flex-col items-center relative overflow-hidden group">
      {/* Background Animated Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #00d4b8 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             animation: 'pulse 10s infinite alternate' 
           }}>
      </div>
      
      <div className="flex items-center justify-between w-full max-w-5xl relative gap-8">
        {/* Input Layers */}
        <div className="flex flex-col space-y-8 relative z-10 w-1/4">
          {[
            { id: 'network', icon: Network, label: 'Network Layer', sub: 'Ingestion Active', color: 'blue-accent' },
            { id: 'endpoint', icon: MonitorSmartphone, label: 'Endpoint Layer', sub: 'Telemetry Pulse', color: 'green-500' },
            { id: 'application', icon: AppWindow, label: 'App Layer', sub: 'Payload Analysis', color: 'orange-warning' }
          ].map((layer) => (
            <motion.div 
              key={layer.id}
              whileHover={{ scale: 1.05, x: 5 }}
              className={`bg-secondary-card p-5 rounded-xl text-center text-sm shadow-2xl border-l-4 transition-all duration-700 cursor-pointer ${
                isLayerActive(layer.id) ? `border-${layer.color} ring-4 ring-${layer.color}/10` : 'border-border-subtle opacity-40 grayscale'
              }`}
            >
              <layer.icon className={`w-6 h-6 mx-auto mb-2 transition-colors duration-700 ${isLayerActive(layer.id) ? `text-${layer.color}` : 'text-text-muted'}`} /> 
              <span className="font-heading font-bold block text-white tracking-tight">{layer.label}</span>
              <div className={`text-[10px] mt-1 font-mono uppercase tracking-widest ${isLayerActive(layer.id) ? `text-${layer.color}/80` : 'text-text-muted'}`}>
                {layer.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central Correlation Engine */}
        <div className="flex-1 flex items-center justify-center relative scale-125">
          <div className="relative">
             {/* Orbital Glow Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute -inset-12 border border-dashed border-teal-accent/10 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute -inset-8 border border-teal-accent/20 rounded-full"
            />
            
            <motion.div 
              animate={activeLayers.length > 0 ? { 
                scale: [1, 1.05, 1],
                boxShadow: [
                    '0 0 20px rgba(0,212,184,0.2)', 
                    '0 0 50px rgba(0,212,184,0.5)', 
                    '0 0 20px rgba(0,212,184,0.2)'
                ] 
              } : {}}
              transition={{ repeat: Infinity, duration: 3 }}
              className="bg-secondary-card border-2 border-teal-accent/50 p-10 rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.5)] z-20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-accent/20 via-transparent to-teal-accent/5"></div>
              <Layers className={`w-12 h-12 ${activeLayers.length > 0 ? 'text-teal-accent animate-pulse' : 'text-text-muted'} mb-3 relative z-10`} />
              <div className="text-center relative z-10">
                <span className="font-heading font-black text-[10px] leading-none tracking-[0.2em] uppercase text-text-muted">Neural Core</span>
                <div className="text-white font-black text-sm tracking-tighter mt-1">SENTINEL-X</div>
              </div>
              <div className="mt-3 text-[9px] text-teal-accent font-mono relative z-10 px-2 py-0.5 bg-teal-accent/10 rounded-full border border-teal-accent/20 flex items-center">
                <Activity className="w-2.5 h-2.5 mr-1" /> RUNNING
              </div>
            </motion.div>
          </div>
        </div>

        {/* Output Destinations */}
        <div className="flex flex-col space-y-8 relative z-10 w-1/4">
          <div className={`bg-secondary-card border-r-4 p-5 rounded-xl text-center text-sm shadow-2xl transition-all duration-700 ${activeLayers.length >= 3 ? 'border-red-alert ring-4 ring-red-alert/10' : 'border-border-subtle opacity-40 grayscale'}`}>
            <ShieldAlert className={`w-6 h-6 mx-auto mb-2 ${activeLayers.length >= 3 ? 'text-red-alert' : 'text-text-muted'}`} /> 
            <span className="font-heading font-bold block text-white tracking-tight">Escalation</span>
            <div className="text-[10px] mt-1 font-mono text-text-muted uppercase tracking-widest">Active Triage</div>
          </div>
          <div className={`bg-secondary-card border-r-4 p-5 rounded-xl text-center text-sm shadow-2xl transition-all duration-700 ${activeLayers.length >= 2 ? 'border-purple-accent ring-4 ring-purple-accent/10' : 'border-border-subtle opacity-40 grayscale'}`}>
            <Skull className={`w-6 h-6 mx-auto mb-2 ${activeLayers.length >= 2 ? 'text-purple-accent' : 'text-text-muted'}`} /> 
            <span className="font-heading font-bold block text-white tracking-tight">MITRE Mapping</span>
            <div className="text-[10px] mt-1 font-mono text-text-muted uppercase tracking-widest">Technique Correlation</div>
          </div>
        </div>

        {/* Dynamic SVG Connections with Enhanced Waves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
          <defs>
            <linearGradient id="grad-network" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E90FF00" />
              <stop offset="50%" stopColor="#1E90FF" />
              <stop offset="100%" stopColor="#1E90FF00" />
            </linearGradient>
            <linearGradient id="grad-endpoint" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e00" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#22c55e00" />
            </linearGradient>
            <linearGradient id="grad-application" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff8c4200" />
              <stop offset="50%" stopColor="#ff8c42" />
              <stop offset="100%" stopColor="#ff8c4200" />
            </linearGradient>
          </defs>

          {/* Connection Waves */}
          {[
            { id: 'network', path: 'M 250 160 Q 380 160 480 240', color: '#1E90FF' },
            { id: 'endpoint', path: 'M 250 240 Q 380 240 480 240', color: '#22c55e' },
            { id: 'application', path: 'M 250 320 Q 380 320 480 240', color: '#ff8c42' }
          ].map(conn => (
            <React.Fragment key={conn.id}>
                {/* Background Line */}
                <path d={conn.path} fill="none" stroke={isLayerActive(conn.id) ? `${conn.color}22` : '#ffffff05'} strokeWidth="1" />
                
                {/* Flowing Wave */}
                <AnimatePresence>
                    {isLayerActive(conn.id) && (
                        <motion.path 
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            d={conn.path} 
                            fill="none" 
                            stroke={`url(#grad-${conn.id})`} 
                            strokeWidth="3" 
                            strokeDasharray="10 20"
                        >
                            <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3s" repeatCount="indefinite" />
                        </motion.path>
                    )}
                </AnimatePresence>
            </React.Fragment>
          ))}
        </svg>
      </div>
    </div>
  );
});

const CorrelationTimeline = React.memo(({ events = [] }: { events: any[] }) => {
  const sortedEvents = useMemo(() => 
    [...events].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15)
  , [events]);

  return (
    <div className="bg-card border border-border-subtle rounded-xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-subtle">
        <h3 className="font-heading font-bold text-lg flex items-center uppercase tracking-tight">
          <Clock className="mr-3 text-teal-accent w-5 h-5" /> 
          Evidence Trail
        </h3>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest bg-secondary-card px-2 py-1 rounded border border-border-subtle">Digital Forensics</span>
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest bg-secondary-card px-2 py-1 rounded border border-border-subtle">Event Sequence</span>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Stem */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-teal-accent/50 via-border-subtle/50 to-transparent"></div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {sortedEvents.length > 0 ? sortedEvents.map((event, idx) => (
              <motion.div 
                key={`evt-${event.id || 'seq'}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative pl-12 group"
              >
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl border-2 border-card flex items-center justify-center z-20 transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                  event.layer === 'network' ? 'bg-blue-accent/20 border-blue-accent' :
                  event.layer === 'endpoint' ? 'bg-green-500/20 border-green-500' : 'bg-orange-warning/20 border-orange-warning'
                }`}>
                  {event.layer === 'network' ? <Network className="w-4 h-4 text-blue-accent" /> :
                   event.layer === 'endpoint' ? <MonitorSmartphone className="w-4 h-4 text-green-500" /> : 
                   <AppWindow className="w-4 h-4 text-orange-warning" />}
                </div>

                <div className="bg-secondary-card/30 backdrop-blur-sm border border-border-subtle p-5 rounded-2xl group-hover:border-teal-accent/50 transition-all group-hover:bg-secondary-card/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-teal-accent transition-colors">
                        {(event.action || event.event_type || 'Unknown').replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-muted font-mono bg-background/50 px-1.5 py-0.5 rounded">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono bg-background/50 px-1.5 py-0.5 rounded">
                            ID: {(event.id || '').toString().slice(0, 8) || 'GEN-LOG'}
                          </span>
                      </div>
                    </div>
                    {event.mitre_technique && (
                      <span className="text-[10px] font-black font-mono bg-purple-accent/10 text-purple-accent px-2 py-1 rounded-lg border border-purple-accent/30 shadow-[0_0_10px_rgba(168,85,247,0.1)] uppercase">
                        {event.mitre_technique}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border-subtle/30">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-text-muted font-black tracking-widest mb-1">Source Context</span>
                      <span className="text-xs text-white font-mono bg-background/30 p-2 rounded-lg border border-border-subtle/30 truncate">{event.normalized?.src_ip || event.normalized?.user || 'SYSTEM'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-text-muted font-black tracking-widest mb-1">Tactical Analysis</span>
                      <span className="text-xs text-teal-accent font-bold uppercase tracking-tight truncate">{event.normalized?.action || 'TELEMETRY BURST'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-text-muted font-black tracking-widest mb-1">Validation</span>
                      <div className="flex items-center">
                          <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden mr-2">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(idx * 13) % 40 + 60}%` }}
                                className="h-full bg-teal-accent"
                              />
                          </div>
                          <span className="text-[10px] text-teal-accent font-bold font-mono">{(idx * 13) % 40 + 60}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Deep Dive Expansion (UI only, for polish) */}
                  <div className="mt-4 pt-4 border-t border-dashed border-border-subtle/30 hidden group-hover:block transition-all">
                      <div className="bg-background/50 rounded-lg p-3 font-mono text-[9px] text-text-muted leading-relaxed overflow-x-auto">
                          {JSON.stringify(event.raw_data || { status: 'secure', bytes: 1420, protocol: 'TLSv1.3' }, null, 2)}
                      </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-24 bg-background/20 rounded-2xl border-2 border-dashed border-border-subtle/50">
                <Database className="w-16 h-16 text-text-muted opacity-20 mx-auto mb-6" />
                <div className="text-white font-black text-xl uppercase tracking-tighter">No Correlated Evidence</div>
                <p className="text-sm text-text-muted mt-2 max-w-sm mx-auto uppercase tracking-widest leading-loose">Select a correlation window from the analytical feed to initiate digital forensic mapping.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

// Core Correlation Engine Logic
const useCorrelationLogic = (windowMinutes: number = 5) => {
  const { rawLogs } = useStore();
  
  return useMemo(() => {
    const windows: Record<string, any> = {};
    const cutoff = subMinutes(new Date(), windowMinutes);

    // Group logs by IP within the window
    rawLogs.forEach(log => {
      const logTime = new Date(log.timestamp);
      if (logTime < cutoff) return;

      const ip = (log.normalized as any)?.src_ip || 'unknown';
      if (ip === 'unknown') return;

      if (!windows[ip]) {
        windows[ip] = {
          id: `WIN-${ip.replaceAll('.', '-')}`,
          src_ip: ip,
          layers: new Set<string>(),
          events: [],
          first_seen: log.timestamp,
          last_seen: log.timestamp,
        };
      }

      windows[ip].layers.add(log.layer);
      windows[ip].events.push(log);
      
      if (new Date(log.timestamp) < new Date(windows[ip].first_seen)) {
        windows[ip].first_seen = log.timestamp;
      }
      if (new Date(log.timestamp) > new Date(windows[ip].last_seen)) {
        windows[ip].last_seen = log.timestamp;
      }
    });

    return Object.values(windows).map(win => {
      const layerCount = win.layers.size;
      let level = 'MEDIUM';
      if (layerCount === 2) level = 'HIGH';
      if (layerCount >= 3) level = 'CRITICAL';

      return {
        ...win,
        layers: Array.from(win.layers),
        level,
        eventCount: win.events.length,
        timeLeft: Math.max(0, windowMinutes * 60 - Math.floor((new Date().getTime() - new Date(win.last_seen).getTime()) / 1000))
      };
    }).sort((a, b) => {
      const severityMap: Record<string, number> = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1 };
      return severityMap[b.level] - severityMap[a.level];
    });
  }, [rawLogs, windowMinutes]);
};

const MatrixItem = React.memo(({ data, isActive, isMatch, onClick, riskColorMap }: any) => {
  return (
    <motion.div 
        whileHover={{ scale: 1.02, x: 5 }}
        onClick={onClick}
        className={`p-5 rounded-2xl border-2 transition-all duration-500 cursor-pointer group/item ${
            isActive ? riskColorMap[data.color] + ' shadow-2xl scale-[1.02]' :
            isMatch 
            ? riskColorMap[data.color] + ' ring-8 ring-white/5' 
            : 'border-border-subtle/50 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
        }`}
    >
        <div className="flex justify-between items-center mb-2">
            <span className="font-heading font-black text-xs uppercase text-white tracking-widest leading-none flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${data.color === 'blue-accent' ? 'bg-[#0070f3]' : data.color === 'orange-warning' ? 'bg-[#f5a623]' : 'bg-[#ff0000]'}`} />
                {data.level} - {data.label}
            </span>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.1em] ${
                data.risk === 'CRITICAL' ? 'bg-[#ff0000] text-white' : 
                data.risk === 'HIGH RISK' ? 'bg-[#f5a623] text-white' : 
                'bg-[#0070f3] text-white'
            }`}>
                {data.risk}
            </span>
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed font-medium">{data.sub}</p>
        
        <div className="mt-4 h-1 bg-background rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                    width: isActive || isMatch ? '100%' : '0%' 
                }}
                className={`h-full ${data.color === 'blue-accent' ? 'bg-[#0070f3]' : data.color === 'orange-warning' ? 'bg-[#f5a623]' : 'bg-[#ff0000]'}`}
            />
        </div>
    </motion.div>
  );
});

export const Correlation = () => {
  const navigate = useNavigate();
  const [selectedWinId, setSelectedWinId] = useState<string | null>(null);
  const [matrixFilter, setMatrixFilter] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  
  const { settings, spawnCorrelationSignals } = useStore();
  const correlationWindows = useCorrelationLogic(settings.correlationWindowMin || 5);
  
  const filteredWindows = useMemo(() => {
    if (!matrixFilter) return correlationWindows;
    if (matrixFilter === 'L1') return correlationWindows.filter(w => w.layers.length === 1);
    if (matrixFilter === 'L2') return correlationWindows.filter(w => w.layers.length === 2);
    if (matrixFilter === 'L3') return correlationWindows.filter(w => w.layers.length >= 3);
    return correlationWindows;
  }, [correlationWindows, matrixFilter]);

  // Auto-select the most critical window if none selected
  useEffect(() => {
    if (!selectedWinId && filteredWindows.length > 0) {
      setSelectedWinId(filteredWindows[0].id);
    }
  }, [filteredWindows.length, selectedWinId]);

  const activeWin = filteredWindows.find(w => w.id === selectedWinId) || filteredWindows[0];

  const [simStatus, setSimStatus] = useState<'IDLE' | 'ANALYSING' | 'INJECTING' | 'CORRELATING'>('IDLE');
  
  const handleSimulation = async () => {
    setSimStatus('ANALYSING');
    await new Promise(r => setTimeout(r, 1500));
    
    setSimStatus('INJECTING');
    await spawnCorrelationSignals();
    await new Promise(r => setTimeout(r, 1000));
    
    setSimStatus('CORRELATING');
    await new Promise(r => setTimeout(r, 1000));
    
    setSimStatus('IDLE');
    setSelectedWinId(null); // Reset selection
  };

  const handleDownloadReport = async () => {
      if (!activeWin) return;
      setReportLoading(true);
      
      // 1. Export JSON Data
      const reportData = {
          report_id: `SENTINEL-AF-${activeWin.id}`,
          timestamp: new Date().toISOString(),
          subject: activeWin.src_ip,
          risk_score: activeWin.risk_score,
          convergence_layers: activeWin.layers,
          evidence_trail: activeWin.events,
          mitre_mapping: activeWin.events.map(e => e.mitre_id).filter(Boolean)
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SENTINEL-FORENSIC-${activeWin.src_ip.replace(/\./g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(url);

      // 2. Trigger Print Dialog for PDF
      setTimeout(() => {
          window.print();
          setReportLoading(false);
      }, 500);
  };
  const riskColorMap: Record<string, string> = {
      'blue-accent': 'border-[#0070f3] bg-[#0070f3]/5 text-[#0070f3]',
      'orange-warning': 'border-[#f5a623] bg-[#f5a623]/5 text-[#f5a623]',
      'red-alert': 'border-[#ff0000] bg-[#ff0000]/5 text-[#ff0000]'
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h1 className="text-4xl font-heading font-black text-white flex items-center uppercase tracking-tighter">
                <Layers className="mr-4 text-teal-accent w-10 h-10" /> 
                Cross-Layer Correlation
            </h1>
            <p className="text-text-muted text-sm mt-2 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-teal-accent" /> Autonomous threat convergence engine monitoring multi-vector telemetry.
            </p>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={handleSimulation}
                disabled={simStatus !== 'IDLE'}
                className={`group relative flex items-center gap-3 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden shadow-2xl ${
                    simStatus !== 'IDLE' 
                    ? 'bg-secondary-card text-text-muted border-border-subtle cursor-wait' 
                    : 'bg-teal-accent hover:bg-teal-accent/90 text-background border-transparent'
                }`}
            >
                {simStatus === 'IDLE' ? (
                    <>
                        <Zap className="w-4 h-4" />
                        Trigger Tactical Simulation
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {simStatus}...
                    </>
                )}
                
                {simStatus === 'IDLE' && (
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                )}
            </button>
            <div className="flex items-center space-x-3 text-xs text-text-muted bg-secondary-card p-2 px-4 rounded-xl border border-border-subtle shadow-xl">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-teal-accent animate-pulse" />
                    <span className="font-bold text-white uppercase font-mono">Real-time Engine Active</span>
                </div>
                <div className="w-px h-4 bg-border-subtle" />
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-mono">{settings.correlationWindowMin}m Detection Window</span>
                </div>
            </div>
        </div>
      </div>

      <FlowDiagram activeLayers={activeWin?.layers || []} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2">
          <div className="bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-secondary-card p-6 border-b border-border-subtle flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <h3 className="font-heading font-black text-lg flex items-center uppercase tracking-tight">
                    <Activity className="mr-3 text-teal-accent w-5 h-5" /> 
                    Analytical Analyzer Feed
                  </h3>
                  {matrixFilter && (
                      <span className="bg-teal-accent/20 text-teal-accent text-[9px] font-black px-2 py-1 rounded-full border border-teal-accent/30 uppercase tracking-widest flex items-center">
                          Filtering: {matrixFilter} <X className="ml-1.5 w-2.5 h-2.5 cursor-pointer" onClick={() => setMatrixFilter(null)} />
                      </span>
                  )}
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={handleDownloadReport}
                    disabled={reportLoading || !activeWin}
                    className="group flex items-center gap-2 bg-purple-accent/10 hover:bg-purple-accent text-purple-accent hover:text-white px-4 py-2 rounded-lg border border-purple-accent/30 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {reportLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {reportLoading ? 'Generating...' : 'Export Forensic Report'}
                  </button>
                  <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest bg-background/50 px-3 py-1.5 rounded-lg border border-border-subtle">
                    Scanning {filteredWindows.length} potential attack paths
                  </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-secondary-card/40">
                  <tr className="border-b border-border-subtle">
                    <th className="p-6 text-[10px] font-black font-mono text-text-muted uppercase tracking-[0.2em]">Window ID</th>
                    <th className="p-6 text-[10px] font-black font-mono text-text-muted uppercase tracking-[0.2em]">Domain/IP</th>
                    <th className="p-6 text-[10px] font-black font-mono text-text-muted uppercase tracking-[0.2em] text-center">Layer Coverage</th>
                    <th className="p-6 text-[10px] font-black font-mono text-text-muted uppercase tracking-[0.2em] text-center">Volume</th>
                    <th className="p-6 text-[10px] font-black font-mono text-text-muted uppercase tracking-[0.2em]">Risk Classification</th>
                    <th className="p-6 text-[10px] font-black font-mono text-text-muted uppercase tracking-[0.2em] text-right">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30 relative">
                    {filteredWindows.map((win) => (
                      <motion.tr 
                        key={win.id}
                        layout="position"
                        onClick={() => setSelectedWinId(win.id)}
                     className={`cursor-pointer transition-all duration-300 group ${selectedWinId === win.id ? 'bg-teal-accent/[0.03]' : 'hover:bg-secondary-card/50'}`}
                      >
                        <td className="p-6 font-mono text-xs">
                          <div className="flex items-center relative">
                            {selectedWinId === win.id && (
                              <motion.div layoutId="selection-bar-id" className="absolute -left-6 w-1 h-10 bg-teal-accent rounded-r-lg shadow-[0_0_15px_rgba(0,212,184,0.8)]" />
                            )}
                            <span className={`transition-all duration-300 ${selectedWinId === win.id ? 'text-teal-accent font-black scale-105' : 'text-text-muted font-bold'}`}>
                              {win.id}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 font-mono text-xs">
                          <div className="flex flex-col">
                            <span className="text-white font-black tracking-tight">{win.src_ip}</span>
                            <span className="text-[9px] text-text-muted mt-1 uppercase">Active for {formatDistanceToNow(new Date(win.first_seen))}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-center space-x-2">
                            {[
                                { layer: 'network', color: 'bg-blue-accent' },
                                { layer: 'endpoint', color: 'bg-green-500' },
                                { layer: 'application', color: 'bg-orange-warning' }
                            ].map(l => (
                                <div 
                                    key={l.layer}
                                    className={`w-3.5 h-3.5 rounded-full ring-2 ring-offset-4 ring-offset-card transition-all duration-500 ${
                                        win.layers.includes(l.layer) ? `${l.color} ring-${l.color}/30 shadow-lg scale-110` : 'bg-background ring-transparent opacity-20'
                                    }`} 
                                    title={l.layer.toUpperCase()}
                                />
                            ))}
                          </div>
                        </td>
                        <td className="p-6 font-mono text-xs text-center">
                            <span className="text-white bg-background/50 px-2 py-1 rounded border border-border-subtle">{win.eventCount}</span>
                        </td>
                        <td className="p-6">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-lg tracking-tighter border shadow-sm flex items-center w-fit gap-2 ${
                            win.level === 'CRITICAL' ? 'bg-red-alert/10 text-red-alert border-red-alert/30' : 
                            win.level === 'HIGH' ? 'bg-orange-warning/10 text-orange-warning border-orange-warning/30' : 
                            'bg-blue-accent/10 text-blue-accent border-blue-accent/30'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                win.level === 'CRITICAL' ? 'bg-red-alert animate-ping' : 
                                win.level === 'HIGH' ? 'bg-orange-warning' : 
                                'bg-blue-accent'
                            }`} />
                            {win.level}
                          </span>
                        </td>
                        <td className="p-6 font-mono text-[10px] text-right">
                          <span className={`font-black p-2 rounded-lg bg-background/50 border border-border-subtle ${win.timeLeft < 30 ? 'text-red-alert animate-pulse border-red-alert/30' : 'text-teal-accent'}`}>
                            {Math.floor(win.timeLeft / 60)}M {win.timeLeft % 60}S
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  {filteredWindows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                            <Search className="w-12 h-12 text-text-muted" />
                            <p className="text-text-muted text-sm italic uppercase tracking-[0.2em]">No Active Windows in Buffer</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card border border-border-subtle rounded-2xl shadow-2xl p-6 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-accent/[0.03] to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 text-[10px] uppercase tracking-widest text-text-muted font-black border-b border-border-subtle pb-6 relative z-10">
               <div className="flex items-center">
                   <Cpu className="w-5 h-5 mr-3 text-teal-accent" /> Logic Escalation Matrix
               </div>
               <Info className="w-4 h-4 cursor-help hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col justify-center relative z-10">
                {[
                  { level: 'L1', label: 'Single Vector', sub: 'Anomaly detected. Initializing window.', risk: 'MEDIUM', color: 'blue-accent', layers: 1 },
                  { level: 'L2', label: 'Multi-Point', sub: 'Layer convergence. High adversary movement.', risk: 'HIGH RISK', color: 'orange-warning', layers: 2 },
                  { level: 'L3', label: 'Confirmed Flow', sub: 'Full stack sync. Active threat confirmed.', risk: 'CRITICAL', color: 'red-alert', layers: 3 }
                ].map((m) => (
                <MatrixItem 
                    key={m.level}
                    data={m}
                    isActive={matrixFilter === m.level}
                    isMatch={(activeWin?.layers?.length || 0) === (m.level === 'L3' ? Math.max(3, activeWin?.layers?.length || 0) : m.layers)}
                    onClick={() => setMatrixFilter(matrixFilter === m.level ? null : m.level)}
                    riskColorMap={riskColorMap}
                />
                ))}
            </div>

            {activeWin && (
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/incidents?id=${activeWin.src_ip}`)}
                className="mt-8 w-full bg-teal-accent hover:bg-teal-accent/90 text-background font-black py-4 rounded-xl flex items-center justify-center transition-all shadow-[0_10px_30px_rgba(0,212,184,0.2)] uppercase text-xs tracking-[0.15em] relative z-10"
              >
                <ExternalLink className="w-4 h-4 mr-3" /> Pivot Investigation
              </motion.button>
            )}
          </div>
        </div>

      </div>

      <CorrelationTimeline events={activeWin?.events || []} />

      {/* Global Print Styles for High-Fidelity PDF Generation */}
      <style dangerouslySetInnerHTML={{ __html: `
          @media print {
              body * { visibility: hidden; }
              #printable-report, #printable-report * { visibility: visible; }
              #printable-report {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white !important;
                  color: black !important;
                  padding: 40px;
              }
              .no-print { display: none !important; }
              .bg-card, .bg-secondary-card { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
              .text-white { color: #111827 !important; }
              .text-teal-accent { color: #0d9488 !important; }
              .text-text-muted { color: #4b5563 !important; }
          }
      `}} />
    </div>
  );
};
