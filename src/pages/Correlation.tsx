import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Network, MonitorSmartphone, AppWindow, ArrowRight, Skull, ShieldAlert } from 'lucide-react';

const FlowDiagram = () => (
  <div className="bg-card border border-border-subtle p-6 rounded-lg shadow-lg mb-6 flex flex-col items-center">
    <div className="flex items-center justify-between w-full max-w-4xl relative">
      <div className="flex flex-col space-y-4 relative z-10 w-1/4">
        <div className="bg-secondary-card border-l-4 border-blue-accent p-3 rounded text-center text-sm shadow">
          <Network className="w-5 h-5 mx-auto mb-1 text-blue-accent" /> Network Layer
        </div>
        <div className="bg-secondary-card border-l-4 border-green-500 p-3 rounded text-center text-sm shadow">
          <MonitorSmartphone className="w-5 h-5 mx-auto mb-1 text-green-500" /> Endpoint Layer
        </div>
        <div className="bg-secondary-card border-l-4 border-orange-warning p-3 rounded text-center text-sm shadow">
          <AppWindow className="w-5 h-5 mx-auto mb-1 text-orange-warning" /> App Layer
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <ArrowRight className="w-8 h-8 text-teal-accent absolute animate-pulse-slow left-4" />
        <ArrowRight className="w-8 h-8 text-teal-accent absolute animate-pulse-slow right-4" />
        
        <div className="bg-secondary-card border border-teal-accent p-6 rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,212,184,0.3)] z-10">
          <Layers className="w-8 h-8 text-teal-accent mb-2" />
          <span className="font-heading font-bold text-center text-sm">Correlation<br/>Engine</span>
        </div>
      </div>

      <div className="flex flex-col space-y-4 relative z-10 w-1/4">
        <div className="bg-secondary-card border-r-4 border-red-alert p-3 rounded text-center text-sm shadow">
          <ShieldAlert className="w-5 h-5 mx-auto mb-1 text-red-alert" /> Incident Escalation
        </div>
        <div className="bg-secondary-card border-r-4 border-purple-accent p-3 rounded text-center text-sm shadow">
          <Skull className="w-5 h-5 mx-auto mb-1 text-purple-accent" /> MITRE Mapping
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {/* Draw subtle connection lines matching the layout */}
        <line x1="25%" y1="15%" x2="50%" y2="50%" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="25%" y1="50%" x2="50%" y2="50%" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="25%" y1="85%" x2="50%" y2="50%" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 4" />
        
        <line x1="50%" y1="50%" x2="75%" y2="30%" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="50%" y1="50%" x2="75%" y2="70%" stroke="#1E3A5F" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    </div>
  </div>
);

const CorrelationTimeline = () => {
  const [load, setLoad] = useState(false);
  useEffect(() => { 
    const timer = setTimeout(() => setLoad(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="bg-card border border-border-subtle p-6 rounded-lg shadow-lg relative overflow-hidden">
      <h3 className="font-heading font-semibold mb-6 flex items-center">
        <Layers className="mr-2 text-teal-accent w-5 h-5" /> Threat Convergence Timeline
      </h3>
      <div className="relative h-32 w-full max-w-3xl mx-auto flex items-center justify-center">
        <div className="absolute w-full h-0.5 bg-border-subtle top-1/2 -translate-y-1/2"></div>
        
        <div className="z-10 bg-red-alert text-white px-4 py-2 font-bold font-mono text-xs rounded-full shadow-[0_0_15px_rgba(255,76,76,0.8)] relative">
          INCIDENT CREATED
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 bg-red-alert/50"></div>
        </div>

        {/* Network Dot */}
        {load && <motion.div 
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: '40%', opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-accent rounded-full border-2 border-card shadow-[0_0_10px_rgba(30,144,255,0.8)]"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-accent whitespace-nowrap">Network Event</div>
        </motion.div>}

        {/* Endpoint Dot */}
        {load && <motion.div 
          initial={{ left: '10%', opacity: 0 }}
          animate={{ left: '46%', opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-card shadow-[0_0_10px_rgba(34,197,94,0.8)]"
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-green-500 whitespace-nowrap">Endpoint Init</div>
        </motion.div>}

        {/* Application Dot */}
        {load && <motion.div 
          initial={{ left: '90%', opacity: 0 }}
          animate={{ left: '55%', opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-warning rounded-full border-2 border-card shadow-[0_0_10px_rgba(255,140,66,0.8)]"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-orange-warning whitespace-nowrap">App Exfil</div>
        </motion.div>}
      </div>
      <div className="flex justify-center mt-4 space-x-6 text-xs text-text-muted">
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-accent mr-2"></span> Network</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Endpoint</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-warning mr-2"></span> Application</span>
      </div>
    </div>
  );
};

export const Correlation = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-white flex items-center">
        <Layers className="mr-3 text-teal-accent" /> Cross-Layer Correlation
      </h1>

      <FlowDiagram />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2">
          <div className="bg-card border border-border-subtle rounded-lg shadow-lg p-6">
            <h3 className="font-heading font-semibold mb-4">Active Correlation Windows</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-secondary-card">
                  <tr>
                    <th className="p-3 text-xs font-mono text-text-muted uppercase">Window ID</th>
                    <th className="p-3 text-xs font-mono text-text-muted uppercase">Source IP</th>
                    <th className="p-3 text-xs font-mono text-text-muted uppercase">Layers Hit</th>
                    <th className="p-3 text-xs font-mono text-text-muted uppercase">Events</th>
                    <th className="p-3 text-xs font-mono text-text-muted uppercase">Level</th>
                    <th className="p-3 text-xs font-mono text-text-muted uppercase">Time Left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-subtle hover:bg-secondary-card bg-red-alert/5">
                    <td className="p-3 font-mono text-xs">WIN-9A8B</td>
                    <td className="p-3 font-mono text-xs text-red-alert">192.168.1.45</td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <span className="w-3 h-3 rounded-full bg-blue-accent" title="Network"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500" title="Endpoint"></span>
                        <span className="w-3 h-3 rounded-full bg-orange-warning" title="App"></span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">42</td>
                    <td className="p-3"><span className="text-xs bg-red-alert text-white px-2 py-1 rounded">CRITICAL</span></td>
                    <td className="p-3 font-mono text-xs text-teal-accent">0m 14s</td>
                  </tr>
                  <tr className="border-b border-border-subtle hover:bg-secondary-card bg-orange-warning/5">
                    <td className="p-3 font-mono text-xs">WIN-2F1C</td>
                    <td className="p-3 font-mono text-xs text-orange-warning">10.0.5.44</td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <span className="w-3 h-3 rounded-full bg-blue-accent" title="Network"></span>
                        <span className="w-3 h-3 rounded-full bg-border-subtle" title="Endpoint (None)"></span>
                        <span className="w-3 h-3 rounded-full bg-orange-warning" title="App"></span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">18</td>
                    <td className="p-3"><span className="text-xs bg-orange-warning text-white px-2 py-1 rounded">HIGH</span></td>
                    <td className="p-3 font-mono text-xs text-teal-accent">2m 41s</td>
                  </tr>
                  <tr className="border-b border-border-subtle hover:bg-secondary-card">
                    <td className="p-3 font-mono text-xs">WIN-88D2</td>
                    <td className="p-3 font-mono text-xs text-text-muted">172.16.0.9</td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <span className="w-3 h-3 rounded-full bg-blue-accent" title="Network"></span>
                        <span className="w-3 h-3 rounded-full bg-border-subtle" title="Endpoint (None)"></span>
                        <span className="w-3 h-3 rounded-full bg-border-subtle" title="App (None)"></span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs">4</td>
                    <td className="p-3"><span className="text-xs bg-blue-accent text-white px-2 py-1 rounded">MEDIUM</span></td>
                    <td className="p-3 font-mono text-xs text-teal-accent">4m 12s</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card border border-border-subtle rounded-lg shadow-lg p-6 h-full flex flex-col justify-center">
            <h3 className="font-heading font-semibold mb-4 text-center">Escalation Logic Matrix</h3>
            <div className="space-y-4">
              <div className="bg-secondary-card p-4 rounded border-l-4 border-blue-accent">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm">1 Layer Hit</span>
                  <span className="text-xs bg-blue-accent text-white px-2 py-1 rounded">MEDIUM</span>
                </div>
                <p className="text-xs text-text-muted mt-2">Single vector anomaly. Keep in monitoring window.</p>
              </div>
              <div className="bg-secondary-card p-4 rounded border-l-4 border-orange-warning">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sm">2 Layers Hit</span>
                  <span className="text-xs bg-orange-warning text-white px-2 py-1 rounded">HIGH</span>
                </div>
                <p className="text-xs text-text-muted mt-2">Cross-layer confirmation. Prepare investigation playbook.</p>
              </div>
              <div className="bg-secondary-card p-4 rounded border-l-4 border-red-alert relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-alert/10 rounded-bl-full animate-pulse"></div>
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-mono font-bold text-sm">3 Layers Hit</span>
                  <span className="text-xs bg-red-alert text-white px-2 py-1 rounded animate-pulse shadow-[0_0_10px_rgba(255,76,76,0.5)]">CRITICAL</span>
                </div>
                <p className="text-xs text-text-muted mt-2 relative z-10">Total coverage correlation. Auto-escalate incident instantly.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <CorrelationTimeline />

    </div>
  );
};
