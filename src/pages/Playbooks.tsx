import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Zap, FileText, CheckCircle2, Copy, Download, 
  Activity, Target, Network, Terminal as TerminalIcon, 
  ArrowRight, ShieldCheck, ChevronRight, Play, RefreshCcw, 
  Search, Filter, Info, AlertTriangle, Clock
} from 'lucide-react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';


const Terminal = ({ logs }: { logs: string[] }) => (
  <div className="bg-[#050505] rounded-xl border border-border-subtle p-4 font-mono text-xs overflow-hidden h-64 flex flex-col shadow-inner">
    <div className="flex items-center gap-1.5 mb-3 border-b border-white/5 pb-2">
      <div className="w-2.5 h-2.5 rounded-full bg-red-alert/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-orange-warning/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-teal-accent/50" />
      <span className="ml-2 text-text-muted text-[10px] uppercase tracking-widest font-black">Playbook Execution Console</span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-text-muted shrink-0">[{format(new Date(), "HH:mm:ss")}]</span>
          <span className={log.startsWith('>') ? 'text-teal-accent' : log.includes('ERR') ? 'text-red-alert' : 'text-gray-400'}>
            {log}
          </span>
        </div>
      ))}
      <div className="animate-pulse inline-block w-2 h-4 bg-teal-accent ml-1 align-middle" />
    </div>
  </div>
);

const FlowNode = ({ step, status, isActive }: { step: any, status: 'pending' | 'running' | 'done', isActive: boolean }) => (
  <motion.div 
    layout
    className={`p-4 rounded-xl border-2 transition-all relative ${
      isActive ? 'border-teal-accent bg-secondary-card shadow-[0_0_20px_rgba(0,212,184,0.15)] scale-[1.05]' : 
      status === 'done' ? 'border-teal-accent/30 bg-background' : 'border-border-subtle bg-background opacity-50'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
        status === 'done' ? 'bg-teal-accent/10 border-teal-accent text-teal-accent' : 
        status === 'running' ? 'bg-teal-accent border-teal-accent text-background animate-pulse' : 
        'bg-background border-border-subtle text-text-muted'
      }`}>
        {status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black tracking-widest text-text-muted uppercase mb-0.5">{step.phase}</div>
        <div className="text-sm font-bold text-white truncate">{step.action}</div>
      </div>
      {status === 'running' && (
         <div className="absolute inset-0 bg-teal-accent/5 animate-pulse rounded-xl" />
      )}
    </div>
  </motion.div>
);

export const Playbooks = () => {
  const { incidents, activePlaybookId, setActivePlaybookId, resolveIncident, escalateIncident, activePlaybookSteps } = useStore();
  const [executionState, setExecutionState] = useState<'IDLE' | 'RUNNING' | 'HALTED' | 'COMPLETED'>('IDLE');
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [notif, setNotif] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const navigate = useNavigate();

  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const selectedIncident = useMemo(() => 
    incidents.find(i => i.id === activePlaybookId) || null
  , [incidents, activePlaybookId]);

  const playbookSteps = useMemo(() => activePlaybookSteps || [], [activePlaybookSteps]);

  useEffect(() => {
    if (executionState === 'RUNNING' && activeStepIndex < playbookSteps.length) {
      const step = playbookSteps[activeStepIndex];
      const nextStep = () => {
        setLogs(prev => [...prev, `> Executing: ${step.command.replace('{src_ip}', selectedIncident?.src_ip || '0.0.0.0').replace('{target}', selectedIncident?.target || 'unknown')}`]);
        
        setTimeout(() => {
          setLogs(prev => [...prev, `[SUCCESS] Step ${step.id} verified. Access control lists updated.`]);
          if (activeStepIndex === playbookSteps.length - 1) {
            setExecutionState('COMPLETED');
            setLogs(prev => [...prev, `[DONE] Full orchestration cycle completed. System stabilized.`]);
          } else {
            setActiveStepIndex(prev => prev + 1);
          }
        }, 1500);
      };
      nextStep();
    }
  }, [executionState, activeStepIndex, playbookSteps, selectedIncident]);

  const handleStart = () => {
    setExecutionState('RUNNING');
    setActiveStepIndex(0);
    setLogs(['INITIALIZING AI COMMANDER...', `Target System: ${selectedIncident?.target}`, 'Fetching dynamic mitigation signatures...']);
  };

  const handleReset = () => {
    setExecutionState('IDLE');
    setActiveStepIndex(-1);
    setLogs([]);
  };

  const handleDownload = () => {
    if (!selectedIncident) return;
    const data = {
        incident_id: selectedIncident.id,
        timestamp: new Date().toISOString(),
        threat_type: selectedIncident.type,
        mitigation_strategy: playbookSteps,
        execution_logs: logs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PLAYBOOK_${selectedIncident.id.slice(0,8)}.json`;
    a.click();
    showNotif("STRATEGY EXPORTED");
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-center relative">
        <AnimatePresence>
            {notif && (
                <motion.div 
                    initial={{ opacity: 0, y: -20, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -20, x: '-50%' }}
                    className="absolute top-0 left-1/2 z-50 bg-teal-accent text-background px-4 py-2 rounded-full text-[10px] font-black shadow-[0_0_30px_rgba(0,212,184,0.4)]"
                >
                    {notif}
                </motion.div>
            )}
        </AnimatePresence>
        <div>
            <h1 className="text-3xl font-heading font-black text-white flex items-center">
                <Play className="mr-3 text-teal-accent w-8 h-8 fill-teal-accent" /> 
                Playbook Commander
            </h1>
            <p className="text-text-muted text-sm mt-1">Autonomous orchestration & human-in-the-loop response nexus.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={() => navigate('/incidents')}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-card hover:bg-background border border-border-subtle rounded-xl text-text-muted hover:text-white transition-all text-xs font-bold"
             >
                <ArrowRight className="w-4 h-4 rotate-180" /> RETURN TO TRIAGE
             </button>
             {selectedIncident && (
                 <>
                    <button 
                        onClick={handleDownload}
                        className="bg-secondary-card hover:bg-background text-text-muted hover:text-white border border-border-subtle p-2 rounded-xl transition-all"
                        title="Download Strategy"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button 
                        disabled={isResolving}
                        onClick={async () => {
                            setIsResolving(true);
                            await resolveIncident(selectedIncident.id);
                            showNotif("INCIDENT RESOLVED & CLOSED");
                            handleReset();
                            setIsResolving(false);
                        }}
                        className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,184,0.1)] ${
                            isResolving ? 'bg-background text-text-muted cursor-wait' : 'bg-teal-accent/10 hover:bg-teal-accent text-teal-accent hover:text-background border border-teal-accent/30'
                        }`}
                    >
                        {isResolving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                        {isResolving ? 'Processing...' : 'Resolve Incident'}
                    </button>
                 </>
             )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Playbook Queue - Left */}
        <div className="w-[380px] flex flex-col space-y-4">
            <div className="bg-card border border-border-subtle p-4 rounded-xl">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span>Active Response Queue</span>
                    <span className="bg-red-alert/10 text-red-alert px-2 py-0.5 rounded italic">{incidents.length} Pending</span>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    {incidents.slice(0, 15).map(inc => (
                        <div 
                            key={inc.id}
                            onClick={() => {
                                setActivePlaybookId(inc.id);
                                handleReset();
                            }}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer group ${
                                activePlaybookId === inc.id ? 'border-teal-accent bg-secondary-card' : 'border-border-subtle hover:border-border-subtle/80 bg-background/50'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter ${inc.severity === 'CRITICAL' ? 'bg-red-alert text-white' : 'bg-blue-accent text-white'}`}>
                                    {inc.severity}
                                </span>
                                <span className="text-[10px] font-mono text-text-muted">{format(new Date(inc.timestamp), "HH:mm")}</span>
                            </div>
                            <h4 className="text-white font-bold text-sm mt-2 uppercase truncate group-hover:text-teal-accent transition-colors">{inc.type.replace('_', ' ')}</h4>
                            <div className="flex justify-between items-center mt-2 text-[10px] font-mono">
                                <span className="text-text-muted">{inc.src_ip}</span>
                                <ChevronRight className={`w-4 h-4 text-teal-accent transition-transform ${activePlaybookId === inc.id ? 'translate-x-1' : ''}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 bg-secondary-card/30 border border-border-subtle rounded-xl p-4 flex flex-col justify-center items-center text-center space-y-3">
                <Info className="w-8 h-8 text-text-muted opacity-20" />
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black max-w-[200px]">Strategic mitigation steps are dynamically generated based on telemetry features.</p>
            </div>
        </div>

        {/* Execution Workspace - Center/Right */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {selectedIncident ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-card/50 border border-border-subtle rounded-2xl">
                    <div className="p-6 border-b border-border-subtle bg-secondary-card/40 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="p-3 rounded-2xl bg-teal-accent/10 border border-teal-accent/20">
                                <Zap className="w-8 h-8 text-teal-accent fill-teal-accent/20" />
                            </div>
                            <div>
                                <h2 className="text-xl font-heading font-black text-white uppercase tracking-tight">{selectedIncident.type.replace('_', ' ')} STRATEGY</h2>
                                <div className="flex gap-4 mt-1">
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                                        <Target className="w-3.5 h-3.5 text-red-alert" /> {selectedIncident.src_ip}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                                        <Clock className="w-3.5 h-3.5 text-teal-accent" /> {format(new Date(selectedIncident.timestamp), "MMM d, HH:mm:ss")}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {executionState === 'IDLE' && (
                             <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="bg-teal-accent text-background font-black px-8 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_30px_rgba(0,212,184,0.3)] group"
                            >
                                <Play className="w-5 h-5 fill-background group-hover:scale-110 transition-transform" /> START ORCHESTRATION
                            </motion.button>
                        )}
                        {executionState === 'COMPLETED' && (
                             <button onClick={handleReset} className="text-teal-accent hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors">
                                <RefreshCcw className="w-4 h-4" /> Reset Flow
                             </button>
                        )}
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Flow Diagram - Left */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-border-subtle">
                            <div className="max-w-md mx-auto relative space-y-8">
                                <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-border-subtle" />
                                <AnimatePresence mode="popLayout">
                                    {playbookSteps.map((step, index) => {
                                        const status = index < activeStepIndex || executionState === 'COMPLETED' ? 'done' : index === activeStepIndex ? 'running' : 'pending';
                                        return (
                                            <FlowNode 
                                                key={step.id} 
                                                step={step} 
                                                status={status} 
                                                isActive={index === activeStepIndex} 
                                            />
                                        );
                                    })}
                                </AnimatePresence>
                                {executionState === 'COMPLETED' && (
                                    <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }} 
                                        className="bg-teal-accent/10 border border-teal-accent/30 p-6 rounded-2xl text-center space-y-2 mt-12"
                                    >
                                        <ShieldCheck className="w-12 h-12 text-teal-accent mx-auto mb-2" />
                                        <h4 className="text-white font-bold uppercase tracking-tight">Strategy Executed Successfully</h4>
                                        <p className="text-[11px] text-text-muted">Persistence removed, threat isolated, and telemetry confirmed stable.</p>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Terminal & Metrics - Right */}
                        <div className="w-[450px] p-6 bg-background/30 flex flex-col space-y-6">
                            <Terminal logs={logs} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary-card p-4 rounded-xl border border-border-subtle border-l-4 border-l-teal-accent">
                                    <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Execution Velocity</div>
                                    <div className="text-xl font-mono font-bold text-white">420ms <span className="text-[10px] text-teal-accent">/ node</span></div>
                                </div>
                                <div className="bg-secondary-card p-4 rounded-xl border border-border-subtle border-l-4 border-l-orange-warning">
                                    <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Autonomy Conf</div>
                                    <div className="text-xl font-mono font-bold text-white">L4 <span className="text-[10px] text-orange-warning">UNSUPERVISED</span></div>
                                </div>
                            </div>

                            <div className="flex-1 bg-secondary-card/40 border-2 border-dashed border-border-subtle rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                                <AlertTriangle className="w-10 h-10 text-orange-warning/50" />
                                <div>
                                    <h5 className="text-white font-bold text-xs uppercase">Escalation Threshold</h5>
                                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed">If playbook efficacy drops below 85%, system will auto-escalate to Tier 2 human supervisor.</p>
                                </div>
                                <button 
                                    disabled={isEscalating}
                                    onClick={async () => {
                                        setIsEscalating(true);
                                        await escalateIncident(selectedIncident.id);
                                        showNotif("ESCALATED TO TIER 2 INTERVENTION");
                                        setTimeout(() => setIsEscalating(false), 2000);
                                    }}
                                    className={`px-6 py-2 border rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${
                                        isEscalating ? 'bg-background text-text-muted cursor-wait border-border-subtle' : 'bg-orange-warning/10 hover:bg-orange-warning text-orange-warning hover:text-background border-orange-warning/30'
                                    }`}
                                >
                                    {isEscalating ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                    {isEscalating ? 'Escalating...' : 'MANUAL ESCALATION'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 bg-card/30 border border-border-subtle rounded-2xl border-dashed">
                    <div className="w-24 h-24 bg-secondary-card rounded-full flex items-center justify-center border border-border-subtle animate-bounce">
                        <TerminalIcon className="w-12 h-12 text-text-muted opacity-20" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-black text-white">No Response Cycle Active</h2>
                        <p className="text-text-muted text-sm max-w-sm mx-auto mt-2">Select a pending incident from the response queue to initialize the playbook commander.</p>
                    </div>
                </div>
            )}
        </div>

      </div>

    </div>
  );
};
