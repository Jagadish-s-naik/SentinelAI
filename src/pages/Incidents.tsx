import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import type { SecurityEvent } from '../types';
import { format } from 'date-fns';
import { X, Brain, ShieldAlert, AlertTriangle, ArrowRight, Network, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useNavigate, useSearchParams } from 'react-router-dom';

const getSeverityColor = (sev: string) => {
  switch (sev) {
    case 'CRITICAL': return 'bg-red-alert text-white shadow-[0_0_8px_rgba(255,76,76,0.8)]';
    case 'HIGH': return 'bg-orange-warning text-white';
    case 'MEDIUM': return 'bg-blue-accent text-white';
    default: return 'bg-text-muted text-background';
  }
};

const Drawer = ({ incident, onClose }: { incident: SecurityEvent | null, onClose: () => void }) => {
  const navigate = useNavigate();

  if (!incident) return null;

  const chartData = incident.shap_features.map(f => ({
    name: f.feature,
    value: f.contribution,
    color: f.contribution >= 0 ? '#00D4B8' : '#FF4C4C' // Teal for pushing towards alert, Red for away
  }));

  const falsePositiveBadge = incident.is_false_positive ? (
    <div className="bg-background border border-teal-accent/50 p-4 rounded-lg flex items-start gap-3 mt-4">
      <div className="p-2 bg-teal-accent/20 rounded-full mt-1">
        <AlertTriangle className="w-5 h-5 text-teal-accent" />
      </div>
      <div>
        <h4 className="text-teal-accent font-bold mb-1">⚠️ LIKELY FALSE POSITIVE</h4>
        <p className="text-sm text-text-muted">This pattern matches known internal profile. Recommend: verify with asset owner before escalating.</p>
      </div>
    </div>
  ) : (
    <div className="bg-background border border-red-alert/50 p-4 rounded-lg flex items-start gap-3 mt-4">
      <div className="p-2 bg-red-alert/20 rounded-full mt-1">
        <ShieldAlert className="w-5 h-5 text-red-alert" />
      </div>
      <div>
        <h4 className="text-red-alert font-bold mb-1">✅ CONFIRMED THREAT</h4>
        <p className="text-sm text-text-muted">Pattern does not match any known benign baseline. Immediate investigation recommended.</p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-card border-l border-border-subtle shadow-2xl z-50 overflow-y-auto flex flex-col"
      >
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-secondary-card sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
            <h2 className="font-heading font-semibold text-lg">{incident.type.replace('_', ' ').toUpperCase()}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs uppercase mb-1">Incident ID</p>
              <p className="font-mono text-xs">{incident.id.split('-')[0]}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase mb-1">Timestamp</p>
              <p className="font-mono text-xs text-blue-accent">{format(new Date(incident.timestamp), "MMM dd, yyyy HH:mm:ss")}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase mb-1">Source IP</p>
              <p className="font-mono text-red-alert">{incident.src_ip}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase mb-1">Target Asset</p>
              <p className="font-mono">{incident.target}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase mb-1">MITRE ATT&CK</p>
              <p className="font-mono bg-background inline-block px-2 py-1 rounded border border-border-subtle">{incident.mitre_tag}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase mb-1">Layer</p>
              <p className="uppercase">{incident.layer}</p>
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Explainability Section */}
          <div>
            <h3 className="flex items-center text-lg font-semibold font-heading mb-4 text-white">
              <Brain className="w-5 h-5 text-teal-accent mr-2" />
              AI Explainability Report
            </h3>

            <div className="bg-secondary-card border border-teal-accent/30 p-4 rounded-lg mb-4">
              <p className="text-sm">
                This <span className="font-bold text-teal-accent">{incident.type.replace('_', ' ')}</span> alert was triggered primarily because <span className="font-mono text-teal-accent">{incident.shap_features[0]?.feature || 'certain signals'}</span> showed an anomalous value baseline.
              </p>
              <p className="text-sm text-text-muted font-mono mt-2 bg-background p-2 rounded">
                 &gt; {incident.explanation}
              </p>
            </div>

            <div className="h-64 my-6">
              <h4 className="text-xs font-mono text-text-muted mb-2 uppercase">SHAP Feature Importance</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                  <XAxis type="number" stroke="#8CA0C8" fontSize={12} tickFormatter={(v) => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)} />
                  <YAxis dataKey="name" type="category" width={140} stroke="#8CA0C8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F1E3D', border: '1px solid #1E3A5F', borderRadius: '4px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`Score: ${value}`, 'Contribution']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {falsePositiveBadge}

            <div className="mt-6">
              <h4 className="text-xs font-mono text-text-muted mb-3 uppercase">Model Confidence Breakdown</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary-card p-3 rounded flex flex-col items-center justify-center border border-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase text-center mb-1">Isolation Forest</span>
                  <span className="text-lg font-mono font-bold text-teal-accent">94%</span>
                </div>
                <div className="bg-secondary-card p-3 rounded flex flex-col items-center justify-center border border-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase text-center mb-1">XGBoost</span>
                  <span className="text-lg font-mono font-bold text-teal-accent">97%</span>
                </div>
                <div className="bg-secondary-card p-3 rounded flex flex-col items-center justify-center border border-border-subtle">
                  <span className="text-[10px] text-text-muted uppercase text-center mb-1">LSTM</span>
                  <span className="text-lg font-mono font-bold text-teal-accent">89%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border-subtle bg-secondary-card mt-auto shrink-0 space-y-4">
          <div className="flex gap-3">
            <button 
              onClick={() => useStore.getState().updateRemediation(incident.id, 'ISOLATE_IP')}
              className="flex-1 bg-red-alert/10 hover:bg-red-alert/20 text-red-alert border border-red-alert/50 py-2.5 rounded font-bold text-xs flex items-center justify-center transition-all"
            >
              <Network className="w-4 h-4 mr-2" /> Isolate IP
            </button>
            <button 
              onClick={() => useStore.getState().updateRemediation(incident.id, 'PASSWORD_RESET')}
              className="flex-1 bg-orange-warning/10 hover:bg-orange-warning/20 text-orange-warning border border-orange-warning/50 py-2.5 rounded font-bold text-xs flex items-center justify-center transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Force Reset
            </button>
          </div>

          <button 
            onClick={() => {
              useStore.getState().setActivePlaybookId(incident.id);
              navigate('/playbooks');
            }}
            className="w-full bg-teal-accent hover:bg-teal-accent/90 text-background font-bold py-3 px-4 rounded-lg flex justify-center items-center transition-all shadow-[0_0_15px_rgba(0,212,184,0.3)] hover:shadow-[0_0_20px_rgba(0,212,184,0.5)]"
          >
            Generate Playbook <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          
          {incident.history && incident.history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-[10px] text-text-muted uppercase font-mono mb-2">Remediation History</p>
              <div className="space-y-2">
                {incident.history.map((h, i) => (
                  <div key={i} className="flex justify-between text-[11px] font-mono">
                    <span className="text-teal-accent">{h.action}</span>
                    <span className="text-text-muted">{format(new Date(h.timestamp), "HH:mm:ss")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const Incidents = () => {
  const { incidents, bulkResolveIncidents, bulkEscalateIncidents } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'All';
  const mitreFilter = searchParams.get('mitre');
  const incidentIdParam = searchParams.get('id');
  
  const [selectedIncident, setSelectedIncident] = useState<SecurityEvent | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Handle URL-based incident selection
  useEffect(() => {
    if (incidentIdParam && incidents.length > 0) {
      const target = incidents.find(inc => inc.id === incidentIdParam);
      if (target) {
        setSelectedIncident(target);
      }
    }
  }, [incidentIdParam, incidents]);

  const setFilter = (f: string) => {
    setSearchParams(prev => {
      if (f === 'All') prev.delete('filter');
      else prev.set('filter', f);
      prev.delete('mitre'); // Clear mitre filter when changing severity filter
      return prev;
    });
  };

  const filters = ['All', 'Critical', 'High', 'Medium', 'Low', 'False Positive'];

  const filteredIncidents = useMemo(() => {
    let result = incidents;
    
    // Apply MITRE filter first if present
    if (mitreFilter) {
      result = result.filter(i => i.mitre_tag === mitreFilter);
    }
    
    // Apply severity/FP filter
    if (filter !== 'All') {
      if (filter === 'False Positive') {
        result = result.filter(i => i.is_false_positive);
      } else {
        result = result.filter(i => i.severity === filter.toUpperCase());
      }
    }
    return result;
  }, [incidents, filter, mitreFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIncidents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIncidents.map(i => i.id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkResolve = () => {
    bulkResolveIncidents(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkEscalate = () => {
    bulkEscalateIncidents(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-heading font-bold text-white flex items-center">
          <ShieldAlert className="mr-3 text-teal-accent" /> Incident Deep Dive
        </h1>
      </div>

      {/* Filter Bar */}
      <div className="flex p-1 bg-card border border-border-subtle rounded-lg overflow-x-auto">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              filter === f 
                ? 'bg-secondary-card text-teal-accent shadow-sm' 
                : 'text-text-muted hover:text-white hover:bg-background/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-card border border-border-subtle rounded-lg flex flex-col min-h-0 relative">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary-card/50 sticky top-0 z-10">
              <tr>
                <th className="p-4 border-b border-border-subtle w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredIncidents.length}
                    onChange={toggleSelectAll}
                    className="accent-teal-accent"
                  />
                </th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">Severity</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">ID</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">Type</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">Source</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">Target</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">Conf</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">MITRE</th>
                <th className="p-4 border-b border-border-subtle text-xs font-mono text-text-muted uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-text-muted">
                    No incidents match the given criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map(inc => (
                  <tr 
                    key={inc.id} 
                    onClick={() => setSelectedIncident(inc)}
                    className={`border-b border-border-subtle hover:bg-secondary-card cursor-pointer transition-colors group ${
                      selectedIds.includes(inc.id) ? 'bg-teal-accent/5' : ''
                    }`}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(inc.id)}
                        onChange={(e) => toggleSelect(e as any, inc.id)}
                        className="accent-teal-accent"
                      />
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono inline-block min-w-[70px] text-center ${getSeverityColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-text-muted group-hover:text-white transition-colors">{inc.id.split('-')[0]}</td>
                    <td className="p-4 text-sm font-medium">{inc.type.replace('_', ' ')}</td>
                    <td className="p-4 font-mono text-xs text-red-alert">{inc.src_ip}</td>
                    <td className="p-4 font-mono text-xs">{inc.target}</td>
                    <td className="p-4 font-mono text-xs font-bold text-teal-accent">{inc.confidence}%</td>
                    <td className="p-4 font-mono text-xs text-text-muted"><span className="border border-border-subtle px-1 rounded">{inc.mitre_tag}</span></td>
                    <td className="p-4 font-mono text-xs text-text-muted">{format(new Date(inc.timestamp), "HH:mm:ss")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Bulk action bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-teal-accent text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-20 font-bold"
            >
              <span className="text-sm shrink-0">{selectedIds.length} items selected</span>
              <div className="h-6 w-px bg-background/20" />
              <div className="flex gap-3">
                <button 
                  onClick={handleBulkResolve}
                  className="hover:scale-105 transition-transform bg-background/10 px-3 py-1 rounded border border-background/20 text-xs"
                >
                  Bulk Resolve
                </button>
                <button 
                  onClick={handleBulkEscalate}
                  className="hover:scale-105 transition-transform bg-background/10 px-3 py-1 rounded border border-background/20 text-xs"
                >
                  Bulk Escalate
                </button>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="ml-2 hover:bg-background/20 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Basic pagination status bar (mock) */}
        <div className="p-3 border-t border-border-subtle bg-secondary-card text-xs text-text-muted flex justify-between font-mono shrink-0">
          <span>Showing {filteredIncidents.length} incidents</span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      {/* Drawer Overlay backdrop */}
      {selectedIncident && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSelectedIncident(null)}
        />
      )}

      {/* Slide out panel */}
      {<Drawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />}
    </div>
  );
};
