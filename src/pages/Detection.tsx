import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Search, Server, Terminal, Braces, 
  Activity, Zap, ShieldCheck, ChevronRight, Cpu, Globe, 
  Shield, Code, List, Clock, Eye, EyeOff, Info, AlertTriangle, 
  ExternalLink, BarChart3, Database, Fingerprint
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { format } from 'date-fns';

const ModelStatusCard = ({ name, id, accuracy, date, enabled }: { name: string, id: string, accuracy: number, date: string, enabled: boolean }) => {
  const [latency, setLatency] = useState(Math.random() * 20 + 5);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(2, Math.min(100, prev + (Math.random() * 10 - 5))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`bg-card border ${enabled ? 'border-border-subtle hover:border-teal-accent/50' : 'border-red-500/30 opacity-60'} rounded-lg p-5 flex flex-col shadow-lg transition-all duration-500 relative overflow-hidden group`}>
      {enabled && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-teal-accent/50 to-transparent group-hover:via-teal-accent animate-pulse" />
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-heading font-semibold text-white text-lg group-hover:text-teal-accent transition-colors duration-300">{name}</h3>
          <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-mono">NODE_HASH: {id}</p>
        </div>
        <span className={`px-2 py-1 rounded text-[10px] font-bold flex items-center transition-colors duration-300 ${enabled ? 'bg-teal-accent/20 text-teal-accent shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'bg-red-500/20 text-red-400'}`}>
          {enabled ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />} 
          {enabled ? 'OPERATIONAL' : 'DECOMMISSIONED'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5 font-heading">Accuracy</p>
          <div className="flex items-baseline">
            <p className={`font-mono text-2xl font-bold ${enabled ? 'text-teal-accent' : 'text-text-muted'}`}>{enabled ? accuracy : '0.0'}%</p>
            {enabled && <Activity className="w-3 h-3 ml-2 text-teal-accent/40 animate-pulse" />}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5 font-heading">Latency</p>
          <p className="font-mono text-lg font-bold text-white">{enabled ? latency.toFixed(1) : '--'}ms</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle/30 flex justify-between items-center text-[9px] font-mono">
        <span className="text-text-muted">SYNC_TS: {date}</span>
        {enabled && (
          <div className="flex gap-1.5 h-3 items-end">
             {[0, 1, 2].map(i => (
               <motion.div 
                 key={i}
                 animate={{ scaleY: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                 transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                 className="w-1 bg-teal-accent/50 rounded-full h-2"
               />
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ThreatSparkline = ({ title, type, color }: { title: string, type: string, color: string }) => {
  const { incidents } = useStore();
  const relevantIncidents = useMemo(() => incidents.filter(i => i.type === type), [incidents, type]);
  const count = relevantIncidents.length;

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 20 }).map((_, i) => {
      const windowStart = new Date(now.getTime() - (20 - i) * 60000);
      const windowEnd = new Date(now.getTime() - (19 - i) * 60000);
      return { time: i, value: relevantIncidents.filter(inc => {
        const incTime = new Date(inc.timestamp);
        return incTime >= windowStart && incTime < windowEnd;
      }).length };
    });
  }, [relevantIncidents]);

  const hasNewAlert = useMemo(() => {
    if (relevantIncidents.length === 0) return false;
    return (new Date().getTime() - new Date(relevantIncidents[0].timestamp).getTime()) < 10000;
  }, [relevantIncidents]);

  return (
    <div className="bg-secondary-card rounded-lg p-4 flex items-center justify-between shadow-lg border border-border-subtle hover:border-white/10 transition-all relative group overflow-hidden">
      {hasNewAlert && (
        <motion.div 
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="w-1/2 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[9px] text-text-muted font-heading uppercase tracking-[0.2em]">{title}</p>
          {hasNewAlert && <Zap className="w-3 h-3 text-yellow-500 animate-[bounce_0.5s_infinite]" />}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-3xl font-bold text-white shadow-text">{count}</p>
          <span className="text-[9px] text-text-muted font-mono">EVT</span>
        </div>
      </div>
      <div className="w-1/2 h-14 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const EventInspector = ({ log }: { log: any | null }) => {
  const [showRaw, setShowRaw] = useState(false);

  const data = useMemo(() => {
    if (!log) return null;
    let payload = log.normalized;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { payload = {}; }
    }
    return payload || {};
  }, [log]);

  if (!log || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted p-8 text-center bg-black/5">
        <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-6">
          <Info className="w-8 h-8 opacity-20" />
        </div>
        <h3 className="text-lg font-heading font-bold text-white/40 mb-2">No Selection</h3>
        <p className="text-xs font-mono tracking-tight max-w-[200px]">
          Select an event from the stream to hydrate investigation workbench.
        </p>
      </div>
    );
  }

  const timestamp = format(new Date(log.timestamp), "HH:mm:ss.SSS");
  const severity = (Math.random() * 0.4 + 0.1).toFixed(2);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card/10">
      {/* Detail Header */}
      <div className="p-6 border-b border-white/5 bg-secondary-card/40">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-accent/10 border border-teal-accent/20 text-[10px] font-bold text-teal-accent">
                {log.layer.toUpperCase()}
              </span>
              <span className="text-[10px] text-text-muted font-mono">SID: {log.id.toUpperCase().substring(0, 12)}</span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mt-1">Intelligence Report</h2>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-bold text-red-400 font-mono">RISK: {severity}</span>
             </div>
             <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">{timestamp}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
             onClick={() => setShowRaw(!showRaw)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold border transition-all ${
               showRaw 
                 ? 'bg-teal-accent border-teal-accent text-black shadow-[0_0_15px_rgba(45,212,191,0.3)]' 
                 : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
             }`}
          >
            {showRaw ? <List className="w-3.5 h-3.5" /> : <Braces className="w-3.5 h-3.5" />}
            {showRaw ? 'VIEW_STRUCTURED' : 'VIEW_RAW_SCHEMA'}
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
            <ExternalLink className="w-3.5 h-3.5" /> EXPLORE_XDR
          </button>
        </div>
      </div>

      {/* Detail Body */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {showRaw ? (
            <motion.div 
              key="raw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-black/40 rounded-xl p-5 border border-white/5 font-mono text-[11px] leading-relaxed shadow-inner"
            >
              <pre className="text-teal-accent/80 whitespace-pre-wrap break-all">
                {JSON.stringify({ header: { sid: log.id, origin: log.layer, ts: log.timestamp }, payload: data }, null, 2)}
              </pre>
            </motion.div>
          ) : (
            <motion.div 
              key="structured"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Insight Summary */}
              <div className="p-4 rounded-xl bg-teal-accent/[0.03] border border-teal-accent/10 border-l-4 border-l-teal-accent shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-teal-accent" />
                  <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">Automated Analysis</h4>
                </div>
                <p className="text-[13px] text-text-muted leading-relaxed font-heading">
                  SentinelAI processed this {log.layer} event at {timestamp}. The pattern suggests a standard technical telemetry pulse. Cross-correlation with existing threat feeds shows no active malicious association.
                </p>
              </div>

              {/* Bento Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                 {/* Box 1: Identity */}
                 <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                       <Fingerprint className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                       <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Entity Identity</span>
                    </div>
                    <div className="space-y-3">
                       <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted font-mono uppercase">User/Identity</span>
                          <span className="text-sm font-bold text-white">{data.user || 'SYSTEM'}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted font-mono uppercase">Origin Host</span>
                          <span className="text-sm font-bold text-white">{data.hostname || 'NODE_DYN_01'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Box 2: Network Context */}
                 <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                       <Globe className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                       <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Network Context</span>
                    </div>
                    <div className="space-y-3">
                       <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted font-mono uppercase">Source IP</span>
                          <span className="text-sm font-bold text-blue-400">{data.src_ip || 'Internal'}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted font-mono uppercase">Target Port</span>
                          <span className="text-sm font-bold text-orange-400">{data.port || data.dst_port || 'N/A'}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Box 3: Technical Telemetry (Full Width) */}
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                 <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-teal-accent opacity-60" />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Technical Trace</span>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(data).map(([key, value]) => {
                      if (['user', 'src_ip', 'port', 'dst_port', 'hostname'].includes(key)) return null;
                      return (
                        <div key={key} className="flex flex-col p-2 rounded bg-black/20 border border-white/5">
                           <span className="text-[8px] text-text-muted font-mono uppercase tracking-tighter truncate">{key}</span>
                           <span className="text-[11px] font-mono font-bold text-white/90 truncate">{String(value)}</span>
                        </div>
                      );
                    })}
                 </div>
              </div>

              {/* Model Attribution */}
              <div className="flex items-center gap-4 pt-4 opacity-50">
                 <div className="flex items-center gap-1.5">
                    <Database className="w-3 h-3" />
                    <span className="text-[9px] font-mono">DB: PRO_XDR_STORE</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" />
                    <span className="text-[9px] font-mono">PROC: ASYNC_INGEST_V2</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const Detection = () => {
  const { rawLogs, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'network' | 'endpoint' | 'application'>('network');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [liveFocus, setLiveFocus] = useState(true);
  
  const filteredLogs = useMemo(() => rawLogs.filter(l => l.layer === activeTab).slice(0, 40), [rawLogs, activeTab]);
  const selectedLog = useMemo(() => rawLogs.find(l => l.id === selectedEventId) || null, [rawLogs, selectedEventId]);

  // Handle Live Focus
  useEffect(() => {
    if (liveFocus && filteredLogs.length > 0) {
      setSelectedEventId(filteredLogs[0].id);
    }
  }, [filteredLogs, liveFocus]);

  const streamScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Executive Header */}
      <header className="p-6 pb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center">
            <Search className="mr-3 text-teal-accent" /> AI Detection Engine
          </h1>
          <p className="text-[10px] text-text-muted mt-1 font-mono tracking-[0.2em] ml-10">CORE_MODULE: V3.2.0 | REALTIME_ANALYTICS_ON</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-full border border-border-subtle backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-accent" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-teal-accent animate-ping opacity-75" />
              </div>
              <span className="text-[10px] font-mono text-teal-accent font-bold uppercase tracking-[0.2em]">Data Hook Active</span>
            </div>
            <div className="h-5 w-px bg-border-subtle" />
            <div className="text-[10px] font-mono whitespace-nowrap">
              <span className="text-text-muted mr-2">THROUGHPUT:</span>
              <span className="text-white font-bold">{Math.floor(Math.random() * 50 + 210)} KB/s</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 pt-2 gap-6 overflow-hidden">
        {/* Top Stats Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 space-y-4">
               <ThreatSparkline title="Brute Force" type="brute_force" color="#FF5555" />
               <ThreatSparkline title="C2 Beaconing" type="c2_beacon" color="#BD93F9" />
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModelStatusCard name="Isolation Forest" id="NODE_01_IF" accuracy={94.2} date={format(new Date(), "HH:mm")} enabled={settings.models.isolationForest} />
              <ModelStatusCard name="XGBoost Classifier" id="NODE_02_XG" accuracy={96.8} date={format(new Date(), "HH:mm")} enabled={settings.models.xgboost} />
              <ModelStatusCard name="LSTM Time-Series" id="NODE_03_LS" accuracy={91.5} date={format(new Date(), "HH:mm")} enabled={settings.models.lstm} />
            </div>
        </div>

        {/* Triage Workbench Shell */}
        <div className="flex-1 border border-border-subtle rounded-xl bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Workbench Header */}
          <div className="p-4 border-b border-white/5 bg-secondary-card/80 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-md border border-white/5">
              {['network', 'endpoint', 'application'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as any);
                    if (liveFocus) setSelectedEventId(null);
                  }}
                  className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase transition-all rounded-sm flex items-center gap-2 ${
                    activeTab === tab 
                      ? 'bg-teal-accent text-black shadow-[0_0_15px_rgba(45,212,191,0.4)]' 
                      : 'text-text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Server className={`w-3.5 h-3.5 ${activeTab === tab ? 'animate-pulse' : ''}`} />
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-md border border-white/5">
                  <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest text-white/60">Live Focus</span>
                  <button 
                    onClick={() => setLiveFocus(!liveFocus)}
                    className={`p-1 rounded transition-all ${liveFocus ? 'text-teal-accent' : 'text-text-muted opacity-50 text-white/40'}`}
                  >
                    {liveFocus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
               </div>
               <div className="h-6 w-px bg-white/5" />
               <div className="flex items-center gap-6 pr-2">
                 <div className="flex items-center gap-2 text-[10px] font-mono text-teal-accent/60">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    SECURED_INGRESSION
                 </div>
               </div>
            </div>
          </div>

          {/* Workbench Split Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Master Stream (35%) */}
            <div className="w-[380px] border-r border-white/5 bg-[#050505] flex flex-col overflow-hidden relative">
               <div className="p-3 border-b border-white/5 bg-black/40 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-[#00c800] tracking-[0.2em] flex items-center gap-2">
                     <Terminal className="w-3.5 h-3.5" /> INGRESS_PULSE
                  </span>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                     <span className="text-[8px] text-text-muted uppercase font-mono tracking-tighter">Live Recording</span>
                  </div>
               </div>
               
               <div ref={streamScrollRef} className="flex-1 overflow-y-auto custom-scrollbar-slim p-0 selection:bg-teal-accent/30">
                  <AnimatePresence initial={false}>
                    {filteredLogs.map((log, idx) => {
                       const ts = format(new Date(log.timestamp), "HH:mm:ss");
                       const isSelected = selectedEventId === log.id;
                       return (
                         <motion.div
                           key={log.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ duration: 0.2, delay: idx * 0.02 }}
                           onClick={() => {
                             setSelectedEventId(log.id);
                             setLiveFocus(false);
                           }}
                           className={`px-4 py-2.5 cursor-pointer flex border-b border-white/[0.03] transition-all group ${
                             isSelected 
                               ? 'bg-teal-accent/15 border-l-2 border-l-teal-accent' 
                               : 'hover:bg-white/[0.04]'
                           }`}
                         >
                            <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                               <div className="flex justify-between items-center mb-0.5">
                                  <span className={`text-[9px] font-mono leading-none ${isSelected ? 'text-teal-accent font-bold' : 'text-[#008800]'}`}>
                                    {ts}
                                  </span>
                                  <span className={`text-[8px] font-mono px-1 rounded border ${isSelected ? 'border-teal-accent/30 text-teal-accent' : 'border-white/5 text-text-muted opacity-50'}`}>
                                    {log.layer}
                                  </span>
                               </div>
                               <p className={`text-[11px] font-mono truncate leading-none ${isSelected ? 'text-white font-semibold' : 'text-[#00ff00]/60 group-hover:text-[#00ff00]'}`}>
                                  {log.raw}
                               </p>
                            </div>
                            <div className={`flex items-center justify-center transition-all ${isSelected ? 'w-6 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                               <ChevronRight className="w-3.5 h-3.5 text-teal-accent" />
                            </div>
                         </motion.div>
                       );
                    })}
                  </AnimatePresence>
               </div>
               
               {/* Terminal Overlay */}
               <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-black/20" />
            </div>

            {/* Intelligence Inspector (65%) */}
            <div className="flex-1 bg-secondary-card/20 relative overflow-hidden flex flex-col">
               <EventInspector log={selectedLog} />
               
               {/* Scanline Effect */}
               <div className="absolute top-0 bottom-0 left-0 w-px bg-white/5 z-10" />
               <motion.div 
                 animate={{ top: ['0%', '100%'] }}
                 transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                 className="absolute left-0 right-0 h-px bg-teal-accent/10 pointer-events-none z-20 shadow-[0_0_15px_rgba(45,212,191,0.5)]"
               />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
