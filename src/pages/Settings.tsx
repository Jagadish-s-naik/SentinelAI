import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Database, ShieldCheck, Bell, Eye, Key, Download, Trash2, Check, RefreshCcw, Activity, Zap, Cpu, Clock } from 'lucide-react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'engine' | 'api' | 'threats'>('general');
  const { settings, updateSettings, clearIncidents, clearLogs, spawnManualIncident, incidents, rawLogs } = useStore();
  const [acting, setActing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as any;
    if (tab && ['general', 'engine', 'api', 'threats'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleAction = async (actionId: string, fn: () => void) => {
    setActing(actionId);
    await fn();
    setTimeout(() => {
      setActing(null);
      setSuccess(actionId);
      setTimeout(() => setSuccess(null), 3000);
    }, 600);
  };

  const toggleModel = (model: keyof typeof settings.models) => {
    updateSettings({
      models: {
        ...settings.models,
        [model]: !settings.models[model]
      }
    });
  };

  const handleExport = () => {
    const data = {
      export_time: new Date().toISOString(),
      incidents: incidents,
      logs: rawLogs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENTINEL_EXPORT_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="bg-card border border-border-subtle rounded-lg p-6 flex items-center shadow-lg shrink-0">
        <SettingsIcon className="w-8 h-8 text-text-muted mr-4" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-white mb-1">System Configuration</h1>
          <p className="text-text-muted text-sm">Manage SentinelAI engine parameters, integrations, and UI preferences.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Sidebar Nav */}
        <div className="w-64 bg-card border border-border-subtle rounded-lg p-4 flex flex-col space-y-2 shrink-0">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'general' ? 'bg-secondary-card text-white border border-border-subtle' : 'text-text-muted hover:text-white hover:bg-background'
            }`}
          >
            <Eye className="w-4 h-4 mr-3" /> UI & Display
          </button>
          <button 
            onClick={() => setActiveTab('engine')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'engine' ? 'bg-secondary-card text-white border border-border-subtle' : 'text-text-muted hover:text-white hover:bg-background'
            }`}
          >
            <Server className="w-4 h-4 mr-3" /> Core Engine
          </button>
          <button 
            onClick={() => setActiveTab('threats')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'threats' ? 'bg-secondary-card text-white border border-border-subtle' : 'text-text-muted hover:text-white hover:bg-background'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mr-3" /> Threat Simulation
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'api' ? 'bg-secondary-card text-white border border-border-subtle' : 'text-text-muted hover:text-white hover:bg-background'
            }`}
          >
            <Key className="w-4 h-4 mr-3" /> Data Integrations
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border-subtle rounded-lg p-6 overflow-y-auto custom-scrollbar">
          
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-heading text-white border-b border-border-subtle pb-2">Global UI Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background rounded border border-border-subtle">
                  <div>
                    <h3 className="text-white font-bold mb-1">Dark Navy Theme</h3>
                    <p className="text-xs text-text-muted">Force absolute dark mode across all views.</p>
                  </div>
                  <div className="w-12 h-6 bg-teal-accent rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-background rounded-full absolute right-1 top-1"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background rounded border border-border-subtle">
                  <div>
                    <h3 className="text-white font-bold mb-1">Compact Mode</h3>
                    <p className="text-xs text-text-muted">Reduce padding and text size to fit more data.</p>
                  </div>
                  <div className="w-12 h-6 bg-border-subtle rounded-full relative cursor-pointer">
                     <div className="w-4 h-4 bg-text-muted rounded-full absolute left-1 top-1"></div>
                  </div>
                </div>

                 <div className="flex items-center justify-between p-4 bg-background rounded border border-border-subtle">
                  <div>
                    <h3 className="text-white font-bold mb-1 flex items-center"><Bell className="w-4 h-4 mr-2" /> Global Alerts Sound</h3>
                    <p className="text-xs text-text-muted">Play an audible chime for CRITICAL severity incidents.</p>
                  </div>
                  <div className="w-12 h-6 bg-border-subtle rounded-full relative cursor-pointer">
                     <div className="w-4 h-4 bg-text-muted rounded-full absolute left-1 top-1"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-heading text-white border-b border-border-subtle pb-2">Detection Engine Parameters</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded border border-border-subtle">
                    <h3 className="text-white font-bold mb-3 flex items-center"><Download className="w-4 h-4 mr-2 text-teal-accent" /> Telemetry Export</h3>
                    <p className="text-xs text-text-muted mb-4">Download all current active incidents and raw log buffers for external forensic analysis.</p>
                    <button 
                      onClick={handleExport}
                      className="w-full py-2 bg-secondary-card hover:bg-teal-accent/10 border border-teal-accent/50 text-teal-accent text-xs font-bold rounded transition-all"
                    >
                      GENERATE JSON EXPORT
                    </button>
                  </div>

                  <div className="p-4 bg-background rounded border border-red-alert/20">
                    <h3 className="text-white font-bold mb-3 flex items-center"><Trash2 className="w-4 h-4 mr-2 text-red-alert" /> Wipe Environment</h3>
                    <p className="text-xs text-text-muted mb-4">Hard reset all incident states, log buffers, and active playbooks. This action is irreversible.</p>
                    <button 
                      onClick={() => {
                        if (confirm('REALLY WIPE ALL DATA?')) {
                          clearIncidents();
                          clearLogs();
                        }
                      }}
                      className="w-full py-2 bg-red-alert/10 hover:bg-red-alert/20 border border-red-alert/50 text-red-alert text-xs font-bold rounded transition-all"
                    >
                      DANGER: WIPE ALL
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border-subtle" />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Heuristic Sensitivity</label>
                    <input type="range" min="1" max="100" defaultValue="75" className="w-full accent-teal-accent" />
                    <div className="flex justify-between text-xs text-text-muted mt-1 font-mono">
                      <span>Low (Fewer FPs)</span>
                      <span>{settings.alertThreshold}%</span>
                      <span>High (Catch All)</span>
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-white mb-2">Max Log Buffer Size (Events)</label>
                     <select className="w-full bg-background border border-border-subtle text-white p-3 rounded text-sm font-mono focus:outline-none focus:border-teal-accent">
                       <option>1000</option>
                       <option>5000</option>
                       <option selected>10000</option>
                       <option>Uncapped (Danger)</option>
                     </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider opacity-60">Active ML Models</h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-background rounded border border-border-subtle">
                      <div>
                        <h3 className="text-white font-bold mb-1">Isolation Forest</h3>
                        <p className="text-xs text-text-muted">Anomalous pattern detection based on tree isolation.</p>
                      </div>
                      <div 
                        onClick={() => toggleModel('isolationForest')}
                        className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${settings.models.isolationForest ? 'bg-teal-accent border-teal-accent' : 'bg-background border-border-subtle'}`}
                      >
                        <div className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-all ${settings.models.isolationForest ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background rounded border border-border-subtle">
                      <div>
                        <h3 className="text-white font-bold mb-1">XGBoost</h3>
                        <p className="text-xs text-text-muted">Gradient boosted decision trees for risk classification.</p>
                      </div>
                      <div 
                        onClick={() => toggleModel('xgboost')}
                        className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${settings.models.xgboost ? 'bg-teal-accent border-teal-accent' : 'bg-background border-border-subtle'}`}
                      >
                        <div className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-all ${settings.models.xgboost ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>

                    <div className="h-px bg-border-subtle my-2" />

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider opacity-60 flex items-center">
                        <Clock className="w-4 h-4 mr-2" /> SOC Operational Schedule
                      </h3>
                      <p className="text-[10px] text-text-muted italic">Used for context-aware False Positive flagging of administrative and high-privilege activities.</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-text-muted uppercase mb-1.5">Shift Start (UTC)</label>
                          <input 
                            type="time" 
                            value={settings.businessHours?.start || '09:00'}
                            onChange={(e) => updateSettings({ businessHours: { ...settings.businessHours, start: e.target.value } })}
                            className="w-full bg-background border border-border-subtle text-white p-2 rounded text-xs font-mono focus:border-teal-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-text-muted uppercase mb-1.5">Shift End (UTC)</label>
                          <input 
                            type="time" 
                            value={settings.businessHours?.end || '18:00'}
                            onChange={(e) => updateSettings({ businessHours: { ...settings.businessHours, end: e.target.value } })}
                            className="w-full bg-background border border-border-subtle text-white p-2 rounded text-xs font-mono focus:border-teal-accent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border-subtle my-2" />

                    <div className="flex items-center justify-between p-4 bg-background rounded border border-border-subtle">
                      <div>
                        <h3 className="text-white font-bold mb-1">LSTM Neural Network</h3>
                        <p className="text-xs text-text-muted">Recurrent neural network for time-series log analysis.</p>
                      </div>
                      <div 
                        onClick={() => toggleModel('lstm')}
                        className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${settings.models.lstm ? 'bg-teal-accent border-teal-accent' : 'bg-background border-border-subtle'}`}
                      >
                        <div className={`w-4 h-4 bg-background rounded-full absolute top-1 transition-all ${settings.models.lstm ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-heading text-white border-b border-border-subtle pb-2">Production Data Integrations</h2>
               
               <div className="space-y-4">
                 <div className="p-4 bg-background rounded border border-border-subtle">
                   <h3 className="text-white font-bold mb-3 flex items-center group"><Database className="w-4 h-4 mr-2 text-teal-accent" /> Supabase Realtime DB</h3>
                   <div className="flex items-center space-x-2 mb-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <p className="text-xs text-text-muted font-mono">{import.meta.env.VITE_SUPABASE_URL}</p>
                   </div>
                   <p className="text-[10px] text-green-500 font-mono tracking-tighter uppercase">Status: Connected & Synchronized (RLS: Disabled)</p>
                 </div>

                 <div className="p-4 bg-background rounded border border-border-subtle">
                   <h3 className="text-white font-bold mb-3 flex items-center"><Server className="w-4 h-4 mr-2 text-blue-accent" /> Local Log Ingester (sentinel-ingest.js)</h3>
                   <div className="bg-[#0a1024] border border-border-subtle p-3 rounded font-mono text-xs mb-3 text-text-muted">
                     Watcher Target: <span className="text-blue-accent">/logs/sentinel.log</span>
                   </div>
                   <div className="flex gap-2">
                     <span className="px-2 py-1 bg-green-500/10 border border-green-500/50 text-green-500 text-[10px] font-bold rounded">WATCHING</span>
                     <span className="px-2 py-1 bg-secondary-card border border-border-subtle text-text-muted text-[10px] font-bold rounded">SYNCING TO DB</span>
                   </div>
                 </div>

                 <div className="p-4 bg-background rounded border border-border-subtle opacity-50">
                   <h3 className="text-white font-bold mb-3 flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> CrowdStrike Falcon API</h3>
                   <p className="text-xs text-text-muted italic">Integration pending authentication module...</p>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-orange-warning/10 border border-orange-warning/50 p-6 rounded-lg">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-orange-warning font-bold font-heading text-lg">Simulated Attack Injection</h2>
                      <p className="text-sm text-text-muted">
                        Force the simulation engine to generate specific high-severity scenarios immediately.
                      </p>
                    </div>
                    {success && success !== 'burst' && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-teal-accent/20 text-teal-accent border border-teal-accent/30 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center"
                      >
                        <Check className="w-3 h-3 mr-1.5" /> SIMULATION_INJECTED
                      </motion.div>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'ransomware', name: 'Oompa Loompa Ransomware', desc: 'Injects mass file modification logs and lateral movement spikes.', color: 'red-alert' },
                      { id: 'c2', name: 'APT C2 Beacon Spike', desc: 'Generates steady outward HTTPS traffic to unknown domains.', color: 'teal-accent' },
                      { id: 'exfil', name: 'Insider Data Exfiltration', desc: 'Simulates large database queries and external upload flows.', color: 'blue-accent' },
                      { id: 'brute', name: 'Distributed Brute Force', desc: 'Creates high-frequency login failure noise across multiple services.', color: 'orange-warning' }
                    ].map(btn => (
                      <button 
                        key={btn.id}
                        disabled={!!acting}
                        onClick={() => handleAction(btn.id, () => spawnManualIncident(btn.id as any))}
                        className="p-4 bg-background border border-border-subtle rounded-lg text-left hover:border-text-muted transition-all group flex items-start justify-between"
                      >
                        <div>
                          <h3 className={`text-${btn.color} font-bold text-sm mb-1 group-hover:opacity-80`}>{btn.name}</h3>
                          <p className="text-xs text-text-muted line-clamp-2">{btn.desc}</p>
                        </div>
                        {acting === btn.id ? (
                          <RefreshCcw className="w-4 h-4 animate-spin text-text-muted" />
                        ) : success === btn.id ? (
                          <Check className="w-4 h-4 text-teal-accent" />
                        ) : null}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="p-6 bg-secondary-card border border-teal-accent/20 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Cpu className="w-16 h-16" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-accent" />
                        High-Throughput Performance Bay
                      </h3>
                      <p className="text-xs text-text-muted mt-1">Validate system multi-threading and ingestion stability under extreme load (500+ events/sec).</p>
                    </div>
                    <button 
                       onClick={() => handleAction('burst', () => useStore.getState().runThroughputStressTest())}
                       disabled={!!acting}
                       className="px-6 py-3 bg-teal-accent/10 hover:bg-teal-accent/20 border border-teal-accent/50 text-teal-accent text-xs font-black rounded-lg transition-all flex items-center gap-2"
                    >
                      {acting === 'burst' ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      INITIATE STRESS TEST
                    </button>
                  </div>
                  {success === 'burst' && (
                    <p className="text-[10px] text-teal-accent mt-3 font-mono animate-pulse">STRESS_TEST_INGESTED: Batch injection of 500+ telemetry events successful.</p>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
