import { useState } from 'react';
import { Settings as SettingsIcon, Server, Database, ShieldCheck, Bell, Eye, Key, Download, Trash2 } from 'lucide-react';
import { useStore } from '../store';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'engine' | 'api' | 'threats'>('general');
  const { settings, updateSettings, clearIncidents, clearLogs, spawnManualIncident, incidents, rawLogs } = useStore();

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
               <h2 className="text-xl font-heading text-white border-b border-border-subtle pb-2">Third-Party Data Integrations</h2>
               
               <div className="space-y-4">
                 <div className="p-4 bg-background rounded border border-border-subtle">
                   <h3 className="text-white font-bold mb-3 flex items-center"><Database className="w-4 h-4 mr-2" /> Splunk / Elastic Forwarder</h3>
                   <input type="text" placeholder="https://ingest.corp.local:8088" value="https://siem-forward.internal.svc" readOnly className="w-full bg-[#0a1024] border border-border-subtle text-text-muted p-3 rounded font-mono text-sm mb-2" />
                   <p className="text-xs text-green-500 font-mono">Status: Connected (24ms ping)</p>
                 </div>

                 <div className="p-4 bg-background rounded border border-border-subtle opacity-70">
                   <h3 className="text-white font-bold mb-3 flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> CrowdStrike Falcon API</h3>
                   <input type="password" value="************************" readOnly className="w-full bg-[#0a1024] border border-border-subtle text-text-muted p-3 rounded font-mono text-sm mb-2" />
                   <div className="flex gap-2">
                     <button className="px-3 py-1 bg-secondary-card border border-border-subtle rounded text-xs">Verify</button>
                     <button className="px-3 py-1 bg-secondary-card border border-border-subtle text-red-500 rounded text-xs">Revoke Key</button>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-orange-warning/10 border border-orange-warning/50 p-6 rounded-lg">
                 <h2 className="text-orange-warning font-bold font-heading mb-2 text-lg">Simulated Attack Injection</h2>
                 <p className="text-sm text-text-muted mb-6">
                   Force the simulation engine to generate specific high-severity scenarios immediately. Useful for testing Playbooks and Correlation diagrams.
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => spawnManualIncident('ransomware')}
                      className="p-4 bg-secondary-card border border-red-alert/30 hover:border-red-alert rounded text-left transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                      <h3 className="text-red-alert font-bold text-sm mb-1 group-hover:text-red-alert/80">Oompa Loompa Ransomware</h3>
                      <p className="text-xs text-text-muted">Injects mass file modification logs and lateral movement spikes.</p>
                    </button>
                    <button 
                      onClick={() => spawnManualIncident('c2')}
                      className="p-4 bg-secondary-card border border-teal-accent/30 hover:border-teal-accent rounded text-left transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                      <h3 className="text-teal-accent font-bold text-sm mb-1 group-hover:text-teal-accent/80">APT C2 Beacon Spike</h3>
                      <p className="text-xs text-text-muted">Generates steady outward HTTPS traffic to unknown domains.</p>
                    </button>
                    <button 
                      onClick={() => spawnManualIncident('exfil')}
                      className="p-4 bg-secondary-card border border-blue-accent/30 hover:border-blue-accent rounded text-left transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                      <h3 className="text-blue-accent font-bold text-sm mb-1 group-hover:text-blue-accent/80">Insider Data Exfiltration</h3>
                      <p className="text-xs text-text-muted">Simulates large database queries and external upload flows.</p>
                    </button>
                    <button 
                      onClick={() => spawnManualIncident('ddos')}
                      className="p-4 bg-secondary-card border border-text-muted/30 hover:border-white rounded text-left transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                      <h3 className="text-white font-bold text-sm mb-1">DDoS Layer 7 Attempt</h3>
                      <p className="text-xs text-text-muted">Floods ingress logs and spikes CPU metrics heavily.</p>
                    </button>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
