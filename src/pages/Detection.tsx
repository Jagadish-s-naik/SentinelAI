import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, Search, Server, Terminal, Braces, 
  Activity, Zap, ShieldCheck, ChevronRight, Cpu, Globe, 
  Shield, Code, List, Clock
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

const TelemetryInspectorCard = ({ log, isSelected }: { log: any, isSelected: boolean }) => {
  const [showRaw, setShowRaw] = useState(false);

  // Normalize data helper
  const data = useMemo(() => {
    let payload = log.normalized;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { payload = {}; }
    }
    return payload || {};
  }, [log.normalized]);

  // Extract key fields for the grid
  const keyFields = useMemo(() => {
    const fields: { label: string, value: any, icon?: any, color?: string }[] = [];
    
    if (data.src_ip) fields.push({ label: 'SOURCE_IP', value: data.src_ip, icon: Globe, color: 'text-blue-400' });
    if (data.dst_ip) fields.push({ label: 'TARGET_IP', value: data.dst_ip, icon: Shield, color: 'text-purple-400' });
    if (data.port) fields.push({ label: 'DEST_PORT', value: data.port, icon: Server, color: 'text-orange-400' });
    if (data.protocol) fields.push({ label: 'PROTOCOL', value: data.protocol, icon: Activity, color: 'text-teal-accent' });
    if (data.action) fields.push({ label: 'ACTION', value: data.action, icon: Zap, color: data.action.toLowerCase().includes('reject') ? 'text-red-400' : 'text-green-400' });
    if (data.user) fields.push({ label: 'IDENTITY', value: data.user, icon: ShieldCheck, color: 'text-yellow-400' });
    
    // Fallback for generic fields if key ones missing
    Object.entries(data).forEach(([key, val]) => {
      if (fields.length < 6 && !fields.find(f => f.label.toLowerCase() === key.toLowerCase()) && !['layer', 'timestamp', 'schema_version'].includes(key)) {
        fields.push({ label: key.toUpperCase(), value: String(val) });
      }
    });

    return fields;
  }, [data]);

  const timestamp = log.timestamp.split('T')[1].split('.')[0];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mb-4 overflow-hidden rounded-xl border transition-all duration-500 relative ${
        isSelected 
          ? 'bg-teal-accent/[0.07] border-teal-accent/40 shadow-[0_15px_35px_rgba(45,212,191,0.15)] ring-1 ring-teal-accent/20' 
          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
      }`}
    >
      {/* Header Bar */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-tighter ${isSelected ? 'bg-teal-accent text-black' : 'bg-white/10 text-white/60'}`}>
            ID_{log.id.toUpperCase().substring(0, 8)}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-mono">
            <Clock className="w-3 h-3 opacity-50" />
            {timestamp}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRaw(!showRaw)}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${showRaw ? 'text-teal-accent' : 'text-text-muted'}`}
            title="Toggle Raw JSON"
          >
            <Braces className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-accent/10 border border-teal-accent/20">
             <div className="w-1.5 h-1.5 rounded-full bg-teal-accent animate-pulse" />
             <span className="text-[9px] font-bold text-teal-accent uppercase tracking-widest">Augmented</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 pt-3">
        {showRaw ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="font-mono text-[10px] leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar bg-black/40 p-3 rounded-lg border border-white/5"
          >
            <pre className="text-purple-300">
              {JSON.stringify({ header: { sid: log.id, origin: log.layer }, payload: data }, null, 2)}
            </pre>
          </motion.div>
        ) : (
          <div className="space-y-4">
             {/* Key Metrics Grid */}
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {keyFields.map((field, idx) => (
                  <div key={idx} className="flex flex-col gap-1 p-2 rounded bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group/item">
                    <div className="flex items-center gap-1.5">
                       {field.icon && <field.icon className={`w-3 h-3 opacity-40 group-hover/item:opacity-80 transition-opacity ${field.color || 'text-white'}`} />}
                       <span className="text-[8px] text-text-muted font-mono uppercase tracking-tighter">{field.label}</span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold truncate ${field.color || 'text-white/90'}`}>
                      {field.value}
                    </span>
                  </div>
                ))}
             </div>

             {/* Dynamic Summary Strip */}
             <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-teal-accent/[0.03] border border-teal-accent/10">
                <div className="flex items-center gap-2">
                   <Shield className="w-3.5 h-3.5 text-teal-accent opacity-50" />
                   <p className="text-[10px] text-white/80 font-heading leading-tight italic">
                     Data Synapse engine normalized {Object.keys(data).length} telemetry points. No critical threats detected.
                   </p>
                </div>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <div className="flex items-center gap-1.5">
                   <span className="text-[9px] text-text-muted font-mono">SEV:</span>
                   <span className="text-[10px] font-bold text-green-400">0.12</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Intersection Lines */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-[100px] h-[100px] border border-teal-accent/20 rounded-full animate-ping" />
        </div>
      )}
    </motion.div>
  );
};

export const Detection = () => {
  const { rawLogs, incidents, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'network' | 'endpoint' | 'application'>('network');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => rawLogs.filter(l => l.layer === activeTab).slice(0, 15), [rawLogs, activeTab]);
  const normalizedLogs = useMemo(() => filteredLogs.slice().reverse(), [filteredLogs]);

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden p-6 bg-background/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center">
            <Search className="mr-3 text-teal-accent" /> AI Detection Engine
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono tracking-wider ml-10">CORE_MODULE: V3.2.0 | REALTIME_ANALYTICS_ON</p>
        </div>
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
            <span className="text-white font-bold">{Math.floor(Math.random() * 50 + 200)} KB/s</span>
          </div>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModelStatusCard name="Isolation Forest" id="NODE_01_IF" accuracy={94.2} date={format(new Date(), "MM-dd HH:mm")} enabled={settings.models.isolationForest} />
        <ModelStatusCard name="XGBoost Classifier" id="NODE_02_XG" accuracy={96.8} date={format(new Date(), "MM-dd HH:mm")} enabled={settings.models.xgboost} />
        <ModelStatusCard name="LSTM Time-Series" id="NODE_03_LS" accuracy={91.5} date={format(new Date(), "MM-dd HH:mm")} enabled={settings.models.lstm} />
      </div>

      {/* Threat Categories Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ThreatSparkline title="Brute Force" type="brute_force" color="#FF5555" />
        <ThreatSparkline title="Lateral Movement" type="lateral_movement" color="#FFB86C" />
        <ThreatSparkline title="Data Exfiltration" type="exfiltration" color="#8BE9FD" />
        <ThreatSparkline title="C2 Beaconing" type="c2_beacon" color="#BD93F9" />
      </div>

      {/* Real-time Log Ingestion */}
      <div className="border border-border-subtle rounded-xl bg-card/60 backdrop-blur-xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex-1 flex flex-col min-h-[450px] overflow-hidden group">
        <div className="flex justify-between items-center border-b border-white/5 bg-secondary-card/80 px-4 py-3">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            {['network', 'endpoint', 'application'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 text-[10px] font-mono font-bold uppercase transition-all duration-300 rounded-md flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-teal-accent text-black shadow-[0_0_20px_rgba(45,212,191,0.5)] scale-[1.02]' 
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Server className={`w-3.5 h-3.5 ${activeTab === tab ? 'animate-pulse' : ''}`} />
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-5 text-[10px] font-mono text-text-muted pr-2">
            <span className="flex items-center gap-2 transition-all hover:text-teal-accent"><ShieldCheck className="w-3.5 h-3.5" /> Normalizing...</span>
            <span className="flex items-center gap-2 transition-all hover:text-teal-accent"><Terminal className="w-3.5 h-3.5" /> Hooked</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Data Synapse Animation (Flowing Particles) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 z-20 hidden lg:block overflow-hidden">
            {[1,2,3,4,5].map(i => (
              <motion.div
                key={i}
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 1.5 + Math.random(), repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
                className="absolute left-[-2px] w-1 h-10 bg-gradient-to-b from-transparent via-teal-accent to-transparent opacity-40"
              />
            ))}
            <div className="absolute top-1/2 left-[-15px] p-2 bg-card border border-white/10 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] z-30">
               <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                 <ChevronRight className="w-4 h-4 text-teal-accent animate-pulse" />
               </motion.div>
            </div>
          </div>

          {/* Left Side: RAW FEED */}
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#030303] p-0 font-mono text-[11px] overflow-hidden relative selection:bg-teal-accent/30">
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black to-transparent z-10 border-b border-white/5">
              <h4 className="text-[#00c800] text-[10px] uppercase tracking-[0.3em] flex items-center font-bold">
                <Terminal className="w-3.5 h-3.5 mr-3" /> INGRESS_BUFFER
              </h4>
            </div>
            
            <div className="h-full overflow-y-auto px-5 py-16 space-y-2 scroll-smooth custom-scrollbar">
              <AnimatePresence initial={false}>
                {normalizedLogs.map((log) => (
                  <motion.div 
                    key={"raw-"+log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onMouseEnter={() => setSelectedLogId(log.id)}
                    className={`p-1.5 rounded-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${selectedLogId === log.id ? 'bg-teal-accent/15 text-teal-accent border-l-2 border-teal-accent pl-2' : 'text-[#00ff00]/60 hover:text-[#00ff00] hover:bg-white/5'}`}
                  >
                    <span className="text-[#006400] mr-3 font-bold opacity-80">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                    <span className={selectedLogId === log.id ? 'drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]' : ''}>{log.raw}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* Edge Scan Line */}
            <motion.div 
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-teal-accent/5 to-transparent pointer-events-none z-10"
            />
          </div>

          {/* Right Side: NORMALIZED */}
          <div className="flex-1 bg-card/40 p-0 font-mono overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 p-4 bg-secondary-card/80 backdrop-blur-xl border-b border-white/5 z-10 flex justify-between items-center shadow-lg">
              <h4 className="text-teal-accent text-[10px] uppercase tracking-[0.3em] flex items-center font-bold">
                <List className="w-3.5 h-3.5 mr-3" /> SCHEMA_XDR_PRO
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-accent shadow-[0_0_5px_teal-accent]" />
                <span className="text-[9px] text-text-muted">VALID_OBJECTS: {filteredLogs.length}</span>
              </div>
            </div>

            <div className="h-full overflow-y-auto px-6 py-16 custom-scrollbar scroll-smooth">
              <AnimatePresence initial={false}>
                {filteredLogs.map(log => (
                  <TelemetryInspectorCard 
                    key={"norm-"+log.id} 
                    log={log} 
                    isSelected={selectedLogId === log.id} 
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
