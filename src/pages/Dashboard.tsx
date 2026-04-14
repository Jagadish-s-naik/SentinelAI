import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, AlertTriangle, Crosshair, Link, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

import type { LucideIcon } from 'lucide-react';

const MetricCard = ({ title, value, subtitle, colorClass, borderClass, icon: Icon, delay }: { title: string, value: string | number, subtitle: string, colorClass: string, borderClass: string, icon: LucideIcon, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`bg-secondary-card rounded-lg p-5 border-l-4 ${borderClass} flex items-center justify-between shadow-lg`}
  >
    <div>
      <p className="text-text-muted text-xs font-semibold tracking-wider uppercase mb-1">{title}</p>
      <div className="flex items-baseline space-x-2">
        <h3 className={`text-3xl font-mono font-bold ${colorClass}`}>
          {value}
        </h3>
      </div>
      <p className="text-text-muted text-xs mt-2">{subtitle}</p>
    </div>
    <div className={`p-3 rounded-full bg-background/50 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </motion.div>
);

export const Dashboard = () => {
  const { incidents } = useStore();
  const [fuzzedConfidence, setFuzzedConfidence] = useState(87);
  const [fuzzedChains, setFuzzedChains] = useState(2);

  // Auto-fuzzing the confidence and attack chains every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setFuzzedConfidence(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(100, Math.max(75, prev + delta));
      });
      setFuzzedChains(prev => {
        if (Math.random() > 0.8) {
          return prev === 2 ? 3 : 2;
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-red-alert text-white shadow-[0_0_10px_rgba(255,76,76,0.5)]';
      case 'HIGH': return 'bg-orange-warning text-white';
      case 'MEDIUM': return 'bg-blue-accent text-white';
      default: return 'bg-text-muted text-background';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Active Incidents"
          value={incidents.length.toString()}
          subtitle={`${incidents.filter(i => new Date().getTime() - new Date(i.timestamp).getTime() < 3600000).length} in the last hour`}
          colorClass="text-red-alert"
          borderClass="border-red-alert"
          icon={AlertTriangle}
          delay={0.1}
        />
        <MetricCard 
          title="Critical Alerts"
          value={criticalCount.toString()}
          subtitle="Requires immediate attention"
          colorClass="text-orange-warning"
          borderClass="border-orange-warning"
          icon={ShieldAlert}
          delay={0.2}
        />
        <MetricCard 
          title="Detection Confidence"
          value={`${fuzzedConfidence}%`}
          subtitle="Across all active models"
          colorClass="text-teal-accent"
          borderClass="border-teal-accent"
          icon={Crosshair}
          delay={0.3}
        />
        <MetricCard 
          title="Attack Chains Active"
          value={fuzzedChains.toString()}
          subtitle="Correlated multi-vector attacks"
          colorClass="text-purple-accent"
          borderClass="border-purple-accent"
          icon={Link}
          delay={0.4}
        />
      </div>

      {/* Main Panels */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Incident Feed (60%) */}
        <div className="lg:w-[60%] flex flex-col bg-card border border-border-subtle rounded-lg overflow-hidden shadow-lg h-[600px]">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-secondary-card">
            <h2 className="font-heading font-semibold text-lg flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-alert animate-pulse mr-2"></span>
              Live Incident Feed
            </h2>
            <button className="text-xs text-teal-accent hover:text-white transition-colors">
              View History
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {incidents.slice(0, 50).map((inc) => (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  layout
                  className="bg-secondary-card border border-border-subtle rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`px-2 py-1 rounded text-xs font-bold font-mono min-w-[70px] text-center ${getSeverityColor(inc.severity)}`}>
                      {inc.severity}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inc.explanation}</p>
                      <div className="text-xs text-text-muted mt-1 font-mono flex items-center space-x-2">
                        <span>{inc.mitre_tag}</span>
                        <span>•</span>
                        <span>{inc.src_ip} ➔ {inc.target}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-teal-accent font-mono text-sm font-bold">{inc.confidence}%</span>
                    <span className="text-xs text-text-muted">
                      {formatDistanceToNow(new Date(inc.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {incidents.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <Shield className="w-12 h-12 mb-3 opacity-20" />
                <p>Waiting for telemetry signals...</p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Features (40%) */}
        <div className="lg:w-[40%] flex flex-col gap-6">
          <div className="bg-card border border-border-subtle rounded-lg p-6 shadow-lg">
            <h2 className="font-heading font-semibold text-lg mb-4">SentinelAI Active Protections</h2>
            <ul className="space-y-4">
              {[
                "Neural Network Traffic Analysis",
                "Advanced Endpoint Log Parsing",
                "Automated Playbook Generation",
                "MITRE ATT&CK Matrix Correlation",
                "Application Layer DPI",
                "Realtime Active Response"
              ].map((feature, i) => (
                <li key={i} className="flex items-center text-sm text-text-muted">
                  <CheckCircle2 className="w-4 h-4 text-teal-accent mr-3 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-secondary-card to-card border border-border-subtle rounded-lg p-6 shadow-lg flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-accent/5 to-transparent"></div>
            
            <div className="relative z-10 text-center">
              <div className="relative mb-6 mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-teal-accent rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 border border-blue-accent rounded-full animate-spin-slow opacity-30" style={{ animationDuration: '8s'}}></div>
                <Shield className="w-12 h-12 text-teal-accent drop-shadow-[0_0_15px_rgba(0,212,184,0.8)]" />
              </div>
              <h3 className="text-xl font-bold font-mono tracking-widest text-text-primary mb-1">GLOBAL TELEMETRY</h3>
              <p className="text-sm text-teal-accent uppercase tracking-widest">Node-Network Realtime Overlay</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
