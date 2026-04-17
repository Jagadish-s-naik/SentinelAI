import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import type { SecurityEvent } from '../types';
import { format } from 'date-fns';
import { X, Brain, ShieldAlert, AlertTriangle, ArrowRight, Network, RotateCcw, Activity, Search, ShieldCheck, Target, Cpu, Zap, Copy, RefreshCcw, Check, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate, useSearchParams } from 'react-router-dom';

const getSeverityColor = (sev: string) => {
  switch (sev) {
    case 'CRITICAL': return 'bg-red-alert text-white shadow-[0_0_15px_rgba(255,76,76,0.5)]';
    case 'HIGH': return 'bg-orange-warning text-white';
    case 'MEDIUM': return 'bg-blue-accent text-white';
    default: return 'bg-text-muted text-background';
  }
};

const getSeverityBorder = (sev: string) => {
  switch (sev) {
    case 'CRITICAL': return 'border-red-alert/50';
    case 'HIGH': return 'border-orange-warning/50';
    case 'MEDIUM': return 'border-blue-accent/50';
    default: return 'border-border-subtle';
  }
};

const isBusinessHours = (timestamp: string, businessHours: { start: string, end: string }) => {
  const date = new Date(timestamp);
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const timeNum = hour * 60 + minute;

  const [startH, startM] = businessHours.start.split(':').map(Number);
  const [endH, endM] = businessHours.end.split(':').map(Number);
  const startNum = startH * 60 + startM;
  const endNum = endH * 60 + endM;

  return timeNum >= startNum && timeNum <= endNum;
};

const IntelligenceInspector = ({ incident, onClose }: { incident: SecurityEvent | null, onClose: () => void }) => {
  const navigate = useNavigate();
  const { updateRemediation, setActivePlaybookId, settings } = useStore();
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedId = new URLSearchParams(window.location.search).get('id');

  if (!incident) {
    if (selectedId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                <div className="p-6 bg-secondary-card rounded-full border border-teal-accent/20 animate-spin">
                    <RefreshCcw className="w-12 h-12 text-teal-accent opacity-50" />
                </div>
                <div>
                    <h3 className="text-white font-heading font-bold text-lg">Synchronizing Intelligence...</h3>
                    <p className="text-text-muted text-sm max-w-xs">Fetching forensic telemetry for incident {selectedId.slice(0, 8)}</p>
                </div>
            </div>
        );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
        <div className="p-6 bg-secondary-card rounded-full border border-border-subtle animate-pulse">
            <Search className="w-12 h-12 text-text-muted opacity-20" />
        </div>
        <div>
            <h3 className="text-white font-heading font-bold text-lg">No Incident Selected</h3>
            <p className="text-text-muted text-sm max-w-xs">Select a security event from the pulse feed to initiate intelligence inspection.</p>
        </div>
      </div>
    );
  }

  const chartData = incident.shap_features.map(f => ({
    name: f.feature,
    value: f.contribution,
    color: f.contribution >= 0 ? '#00D4B8' : '#FF4C4C'
  }));

  const handleAction = async (action: string) => {
    setExecutingAction(action);
    await updateRemediation(incident.id, action);
    setTimeout(() => {
        setExecutingAction(null);
    }, 1500);
  };

  const isMitigated = incident.status === 'MITIGATED';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background/30 backdrop-blur-md rounded-xl border border-border-subtle shadow-2xl">
      {/* Inspector Header */}
      <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-secondary-card/50">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${getSeverityColor(incident.severity)}`}>
            {isMitigated ? <ShieldCheck className="w-6 h-6 text-white" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{incident.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${isMitigated ? 'bg-teal-accent/20 text-teal-accent' : 'bg-red-alert/10 text-red-alert'}`}>
                    {isMitigated ? 'MITIGATION APPLIED' : 'AI CONFIRMED'}
                </span>
            </div>
            <h2 className="font-heading font-black text-xl text-white uppercase tracking-tight">{incident.type.replace('_', ' ')}</h2>
            {/* suspected FP Banner */}
            {isBusinessHours(incident.timestamp, settings.businessHours) && incident.confidence < 85 && (incident.type === 'exfiltration' || incident.mitre_tag === 'T1053') && (
                <div className="mt-1 flex items-center gap-2 px-2 py-0.5 bg-orange-warning/10 border border-orange-warning/30 rounded text-[9px] font-black text-orange-warning animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    SUSPECTED FALSE POSITIVE — OPERATIONAL HOURS DETECTED
                </div>
            )}
          </div>
        </div>
        <button onClick={onClose} className="xl:hidden p-2 hover:bg-background rounded-full transition-colors text-text-muted">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Bento Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Row 1: Key Metadata Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary-card border border-border-subtle p-4 rounded-xl shadow-lg group hover:border-teal-accent/30 transition-colors relative">
                <div className="flex items-center gap-2 text-text-muted mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Source Entity</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-lg font-mono font-bold text-red-alert">{incident.src_ip}</div>
                    <button 
                        onClick={() => copyToClipboard(incident.src_ip, 'src')}
                        className="p-1 hover:bg-background rounded text-text-muted hover:text-teal-accent transition-colors relative"
                        title="Copy Source IP"
                    >
                        {copiedId === 'src' ? <Check className="w-3.5 h-3.5 text-teal-accent" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'src' && (
                            <motion.span 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-teal-accent text-background text-[10px] px-2 py-1 rounded font-black whitespace-nowrap"
                            >
                                COPIED
                            </motion.span>
                        )}
                    </button>
                </div>
                <div className="text-[10px] text-text-muted mt-1">External Reputation: MALEVOLENT</div>
            </div>
            <div className="bg-secondary-card border border-border-subtle p-4 rounded-xl shadow-lg group hover:border-teal-accent/30 transition-colors relative">
                <div className="flex items-center gap-2 text-text-muted mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Target Asset</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-lg font-mono font-bold text-white">{incident.target}</div>
                    <button 
                        onClick={() => copyToClipboard(incident.target, 'target')}
                        className="p-1 hover:bg-background rounded text-text-muted hover:text-teal-accent transition-colors relative"
                        title="Copy Target Host"
                    >
                        {copiedId === 'target' ? <Check className="w-3.5 h-3.5 text-teal-accent" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'target' && (
                            <motion.span 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-teal-accent text-background text-[10px] px-2 py-1 rounded font-black whitespace-nowrap"
                            >
                                COPIED
                            </motion.span>
                        )}
                    </button>
                </div>
                <div className="text-[10px] text-text-muted mt-1">Asset Criticality: LEVEL 4</div>
            </div>
            <div className="bg-secondary-card border border-border-subtle p-4 rounded-xl shadow-lg group hover:border-teal-accent/30 transition-colors">
                <div className="flex items-center gap-2 text-text-muted mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Confidence</span>
                </div>
                <div className="text-2xl font-mono font-black text-teal-accent">{incident.confidence}%</div>
                <div className="w-full bg-background h-1.5 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${incident.confidence}%` }}
                        className="h-full bg-teal-accent"
                    />
                </div>
            </div>
        </div>

        {/* Row 2: Explainability & Analysis */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-secondary-card/40 border border-border-subtle p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain className="w-32 h-32" />
                </div>
                <h3 className="text-white font-heading font-bold flex items-center mb-4">
                    <Cpu className="w-4 h-4 mr-2 text-teal-accent" />
                    Heuristic Analysis Plan
                </h3>
                <div className="space-y-4">
                    <div className="p-4 bg-background/50 rounded-lg border border-teal-accent/20">
                        <p className="text-sm text-text-muted leading-relaxed">
                            <span className="font-bold text-teal-accent">Summary:</span> {incident.explanation}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <a 
                            href={`https://attack.mitre.org/techniques/${incident.mitre_tag}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-between items-center p-2 bg-background/30 rounded border border-transparent hover:border-teal-accent/30 transition-colors group"
                        >
                            <span className="text-text-muted uppercase">Framework</span>
                            <span className="font-mono text-white flex items-center gap-1">
                                MITRE {incident.mitre_tag}
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </a>
                        <div className="flex justify-between items-center p-2 bg-background/30 rounded">
                            <span className="text-text-muted uppercase">Layer</span>
                            <span className="font-mono text-white tracking-widest uppercase">{incident.layer}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-secondary-card/40 border border-border-subtle p-6 rounded-xl">
                <h3 className="text-white font-heading font-bold flex items-center mb-4">
                    <Activity className="w-4 h-4 mr-2 text-orange-warning" />
                    SHAP Feature Delta
                </h3>
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#8CA0C8" fontSize={10} width={80} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1E3A5F', border: 'none', borderRadius: '4px' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Row 3: Remediation Console & Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-secondary-card p-6 rounded-xl border border-teal-accent/20 shadow-[0_0_30px_rgba(0,212,184,0.05)]">
                <h3 className="text-white font-heading font-bold flex items-center mb-6 uppercase tracking-widest text-xs">
                    <ShieldCheck className="w-4 h-4 mr-2 text-teal-accent" />
                    Response Action Nexus
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button 
                        whileHover={{ scale: isMitigated ? 1 : 1.02 }}
                        whileTap={{ scale: isMitigated ? 1 : 0.98 }}
                        disabled={isMitigated || executingAction === 'ISOLATE_IP'}
                        onClick={() => handleAction('ISOLATE_IP')}
                        className={`flex items-center justify-center gap-2 border p-4 rounded-xl font-bold transition-all group ${
                            isMitigated ? 'bg-background text-text-muted border-border-subtle cursor-not-allowed opacity-50' : 
                            'bg-red-alert/10 hover:bg-red-alert/20 text-red-alert border-red-alert/30'
                        }`}
                    >
                        {executingAction === 'ISOLATE_IP' ? (
                            <RefreshCcw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Network className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        )}
                        <span>{executingAction === 'ISOLATE_IP' ? 'Executing Isolate...' : isMitigated ? 'Already Mitigated' : 'Terminate Flow & Isolate IP'}</span>
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: isMitigated ? 1 : 1.02 }}
                        whileTap={{ scale: isMitigated ? 1 : 0.98 }}
                        disabled={isMitigated || executingAction === 'PASSWORD_RESET'}
                        onClick={() => handleAction('PASSWORD_RESET')}
                        className={`flex items-center justify-center gap-2 border p-4 rounded-xl font-bold transition-all group ${
                            isMitigated ? 'bg-background text-text-muted border-border-subtle cursor-not-allowed opacity-50' : 
                            'bg-orange-warning/10 hover:bg-orange-warning/20 text-orange-warning border-orange-warning/30'
                        }`}
                    >
                        {executingAction === 'PASSWORD_RESET' ? (
                            <RefreshCcw className="w-5 h-5 animate-spin" />
                        ) : (
                            <RotateCcw className="w-5 h-5 group-hover:-rotate-90 transition-transform" />
                        )}
                        <span>{executingAction === 'PASSWORD_RESET' ? 'Executing Reset...' : isMitigated ? 'Already Mitigated' : 'Initiate Credential Reset'}</span>
                    </motion.button>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                        setActivePlaybookId(incident.id);
                        navigate('/playbooks');
                    }}
                    className="w-full mt-4 bg-teal-accent hover:bg-teal-accent/90 text-background font-black p-4 rounded-xl flex justify-center items-center transition-all shadow-[0_0_30px_rgba(0,212,184,0.3)]"
                >
                    GO TO PLAYBOOK COMMANDER <ArrowRight className="ml-2 w-6 h-6" />
                </motion.button>
            </div>

            <div className="bg-secondary-card p-6 rounded-xl border border-border-subtle">
                <h3 className="text-white font-heading font-bold flex items-center mb-6 uppercase tracking-widest text-[10px]">
                    <Clock className="w-3.5 h-3.5 mr-2 text-text-muted" />
                    Action History
                </h3>
                <div className="space-y-4">
                    {incident.history?.slice().reverse().map((h, i) => (
                        <div key={i} className="flex gap-3 border-l-2 border-border-subtle pl-4 relative">
                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-accent shadow-[0_0_10px_rgba(0,212,184,0.8)]" />
                            <div className="flex-1">
                                <div className="text-[10px] text-white font-bold uppercase">{h.action.replace('_', ' ')}</div>
                                <div className="text-[9px] text-text-muted font-mono">{format(new Date(h.timestamp), "HH:mm:ss")} · {h.timestamp.slice(0, 10)}</div>
                            </div>
                        </div>
                    ))}
                    {(!incident.history || incident.history.length === 0) && (
                        <div className="text-center py-4 text-text-muted italic text-[10px]">
                            No investigative actions documented.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export const Incidents = () => {
  const { incidents } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filter = searchParams.get('filter') || 'All';
  const selectedId = searchParams.get('id');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedIncident = useMemo(() => 
    incidents.find(i => i.id === selectedId) || null
  , [incidents, selectedId]);

  const filteredIncidents = useMemo(() => {
    let result = incidents;
    if (filter !== 'All') {
      result = result.filter(i => i.severity === filter.toUpperCase());
    }
    if (searchQuery) {
        result = result.filter(i => 
            i.src_ip.includes(searchQuery) || 
            i.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.id.includes(searchQuery)
        );
    }
    return result.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [incidents, filter, searchQuery]);

  const setFilter = (f: string) => {
    setSearchParams(prev => {
      if (f === 'All') prev.delete('filter');
      else prev.set('filter', f);
      return prev;
    });
  };

  const handleSelectIncident = (id: string) => {
    setSearchParams(prev => {
        prev.set('id', id);
        return prev;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      
      {/* Metrics Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-heading font-black text-white flex items-center">
                <ShieldAlert className="mr-3 text-red-alert w-8 h-8" /> 
                Threat Incident Pulse
            </h1>
            <p className="text-text-muted text-sm mt-1">Real-time analytical triage for confirmed detections.</p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-secondary-card border border-border-subtle px-4 py-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-alert animate-ping" />
                <span className="text-[10px] font-black font-mono text-white">LIVE MONITORING</span>
            </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Master Column: Incident Pulse Feed */}
        <div className="w-full xl:w-[420px] flex flex-col space-y-4">
            {/* Search & Filter Mini-Bar */}
            <div className="bg-card border border-border-subtle p-3 rounded-xl space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                        type="text" 
                        placeholder="Search IP, Technique, ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-secondary-card/50 border border-border-subtle rounded-lg py-2 pl-10 pr-4 text-xs font-mono focus:border-teal-accent transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {['All', 'Critical', 'High', 'Medium'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all ${filter === f ? 'bg-teal-accent text-background shadow-lg' : 'bg-secondary-card text-text-muted border border-border-subtle hover:border-teal-accent/50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredIncidents.map((inc) => (
                            <motion.div
                                key={inc.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => handleSelectIncident(inc.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                                    selectedId === inc.id ? `${getSeverityBorder(inc.severity)} bg-secondary-card shadow-2xl scale-[1.02]` : 'border-border-subtle bg-card hover:border-border-subtle/80 hover:bg-secondary-card/50'
                                }`}
                            >
                                {selectedId === inc.id && (
                                    <motion.div layoutId="selection-glow" className="absolute inset-0 bg-gradient-to-r from-teal-accent/5 to-transparent pointer-events-none" />
                                )}
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter ${getSeverityColor(inc.severity)}`}>
                                                {inc.severity}
                                            </span>
                                            {inc.status === 'MITIGATED' && (
                                                <span className="bg-teal-accent/10 text-teal-accent text-[8px] px-1 rounded flex items-center gap-0.5">
                                                    <ShieldCheck className="w-2.5 h-2.5" /> MTG
                                                </span>
                                            )}
                                            <span className="text-[10px] font-mono text-text-muted">CID:{inc.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="text-white font-bold text-sm tracking-tight uppercase">{inc.type.replace('_', ' ')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-mono text-text-muted">{format(new Date(inc.timestamp), "HH:mm:ss")}</div>
                                        <div className="text-[10px] font-mono text-teal-accent mt-1">{inc.confidence}% Match</div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 flex justify-between items-center text-[11px] relative z-10">
                                   <div className="flex items-center text-red-alert font-mono">
                                        <Target className="w-3 h-3 mr-1" /> {inc.src_ip}
                                   </div>
                                   <div className="text-text-muted border border-border-subtle px-1.5 rounded font-mono text-[9px] uppercase">
                                       {inc.mitre_tag}
                                   </div>
                                </div>

                                {selectedId === inc.id && (
                                    <motion.div 
                                        layoutId="active-indicator" 
                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-teal-accent rounded-l-full shadow-[0_0_15px_rgba(0,212,184,0.8)]"
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* Detail Column: Intelligence Inspector */}
        <div className="hidden xl:block flex-1">
            <IntelligenceInspector 
                incident={selectedIncident} 
                onClose={() => setSearchParams(prev => { prev.delete('id'); return prev; })} 
            />
        </div>

      </div>

      {/* Mobile/Tablet Detail Overlay */}
      <AnimatePresence>
        {selectedIncident && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="xl:hidden fixed inset-0 z-50 p-4 bg-background/95 backdrop-blur-xl overflow-y-auto"
            >
                <div className="max-w-3xl mx-auto h-full">
                    <IntelligenceInspector 
                        incident={selectedIncident} 
                        onClose={() => setSearchParams(prev => { prev.delete('id'); return prev; })} 
                    />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
