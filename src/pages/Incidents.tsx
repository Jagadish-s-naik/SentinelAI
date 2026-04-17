import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import type { SecurityEvent } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Search, X, Brain, AlertTriangle, ChevronRight, Network,
  ShieldCheck, Clock, Copy, RotateCcw, Check, Activity, Target, BookOpen
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showToast } from '../components/Layout';

// ── Error Boundary ─────────────────────────────────────────────────────────────
class InspectorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
          <AlertTriangle className="w-12 h-12" style={{ color: '#E53935' }} />
          <div>
            <h3 className="font-semibold" style={{ color: '#111827' }}>Inspector Error</h3>
            <p className="text-xs mt-1 font-mono" style={{ color: '#9CA3AF' }}>{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })}
              className="mt-4 btn-ghost text-xs">Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: string }) {
  const cls = sev === 'CRITICAL' ? 'badge-critical' : sev === 'HIGH' ? 'badge-high' : sev === 'MEDIUM' ? 'badge-medium' : 'badge-low';
  return <span className={`${cls} text-[10px] px-2 py-0.5 rounded font-bold`}>{sev}</span>;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'ACTIVE') return <span className="text-[10px] px-2 py-0.5 rounded font-bold badge-critical">ACTIVE</span>;
  if (status === 'MITIGATED') return <span className="text-[10px] px-2 py-0.5 rounded font-bold badge-low">MITIGATED</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded font-bold badge-medium">RESOLVED</span>;
}

// ── Left Panel: Incident Card ─────────────────────────────────────────────────
function IncidentCard({ inc, isSelected, onClick }: { inc: SecurityEvent; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border transition-all mb-2 block"
      style={{
        background: isSelected ? '#FFF1F0' : '#FAFAFA',
        borderColor: isSelected ? '#E53935' : '#E5E7EB',
        borderLeft: isSelected ? '3px solid #E53935' : '3px solid transparent',
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <SevBadge sev={inc.severity} />
        <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>
          {formatDistanceToNow(new Date(inc.timestamp), { addSuffix: true })}
        </span>
      </div>
      <div className="font-semibold text-xs mb-1" style={{ color: '#111827' }}>
        {inc.title || inc.type.replace(/_/g, ' ').toUpperCase()}
      </div>
      <div className="font-mono text-[10px] truncate" style={{ color: '#9CA3AF' }}>
        {inc.src_ip} → {inc.target}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
          {inc.mitre_tag}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: inc.confidence > 85 ? '#E53935' : '#6B7280' }}>
          {inc.confidence}%
        </span>
      </div>
    </button>
  );
}

// ── Right Panel: Detail View ──────────────────────────────────────────────────
function IncidentDetail({ inc, onClose }: { inc: SecurityEvent; onClose: () => void }) {
  const { resolveIncident, escalateIncident, setAutoRemediate } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'explanation' | 'forensic' | 'history'>('explanation');
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(inc.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResolve = () => {
    resolveIncident(inc.id);
    showToast({ type: 'success', title: 'Mitigation Applied', desc: `Incident ${inc.id.slice(0, 8)} marked as resolved.` });
  };

  const handleEscalate = () => {
    escalateIncident(inc.id);
    showToast({ type: 'warning', title: 'Incident Escalated', desc: 'Forwarded to Tier-2 SOC.' });
  };

  const shapFeatures = (inc.shap_features ?? []).slice(0, 6);

  return (
    <motion.div
      key={inc.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="h-full flex flex-col"
      style={{ background: '#FFFFFF' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SevBadge sev={inc.severity} />
            <StatusBadge status={inc.status} />
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>{inc.mitre_tag}</span>
          </div>
          <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>{inc.type.replace(/_/g, ' ').toUpperCase()}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs" style={{ color: '#9CA3AF' }}>ID: {inc.id.slice(0, 12)}…</span>
            <button onClick={copyId} style={{ color: '#9CA3AF' }}>
              {copied ? <Check className="w-3 h-3" style={{ color: '#22C55E' }} /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost p-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-6 shrink-0" style={{ borderColor: '#E5E7EB' }}>
        {([['explanation', 'AI Explanation'], ['forensic', 'Forensic Graph'], ['history', 'History']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="px-4 py-3 text-xs font-semibold border-b-2 transition-colors"
            style={{
              borderColor: activeTab === id ? '#E53935' : 'transparent',
              color: activeTab === id ? '#E53935' : '#6B7280',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'explanation' && (
            <motion.div key="exp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

              {/* Source + Target Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border" style={{ background: '#FFF1F0', borderColor: '#FECACA' }}>
                  <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#9CA3AF' }}>Source Entity</div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#E53935' }}>{inc.src_ip}</div>
                  <div className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{inc.layer.toUpperCase()} layer</div>
                </div>
                <div className="p-4 rounded-lg border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
                  <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#9CA3AF' }}>Target Asset</div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#111827' }}>{inc.target}</div>
                  <div className="text-xs mt-1 font-semibold" style={{ color: inc.confidence > 85 ? '#E53935' : '#6B7280' }}>
                    {inc.confidence}% confidence
                  </div>
                </div>
              </div>

              {/* Heuristic Analysis */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Heuristic Analysis</h3>
                <div className="p-4 rounded-lg border text-sm leading-relaxed" style={{ background: '#F9FAFB', borderColor: '#E5E7EB', color: '#374151' }}>
                  {inc.explanation}
                </div>
              </div>

              {/* SHAP Feature Delta */}
              {shapFeatures.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>SHAP Feature Delta</h3>
                  <div className="space-y-2.5">
                    {shapFeatures.map(f => {
                      const pct = Math.min(100, Math.abs(f.contribution) * 100);
                      const isPositive = f.contribution >= 0;
                      return (
                        <div key={f.feature} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium" style={{ color: '#374151' }}>{f.feature}</span>
                            <span className="font-mono font-bold" style={{ color: isPositive ? '#E53935' : '#3B82F6' }}>
                              {isPositive ? '+' : ''}{f.contribution.toFixed(3)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: isPositive ? '#E53935' : '#3B82F6' }}
                            />
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>
                            Value: {typeof f.value === 'number' ? f.value.toFixed(4) : f.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Response Action Nexus */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>Response Action Nexus</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleResolve} className="btn-primary text-xs py-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                  <button onClick={handleEscalate} className="btn-ghost text-xs py-2">
                    <Network className="w-3.5 h-3.5" /> Escalate to T2
                  </button>
                  <button
                    onClick={() => navigate(`/playbooks?inc=${inc.id}`)}
                    className="btn-ghost text-xs py-2" style={{ color: '#E53935', borderColor: '#FECACA' }}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> GO TO PLAYBOOK COMMANDER →
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div>
                  <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#9CA3AF' }}>Detected At</div>
                  <div className="font-mono text-xs" style={{ color: '#374151' }}>{format(new Date(inc.timestamp), 'MMM dd HH:mm:ss')}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#9CA3AF' }}>Time Elapsed</div>
                  <div className="font-mono text-xs" style={{ color: '#374151' }}>{formatDistanceToNow(new Date(inc.timestamp))}</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'forensic' && (
            <motion.div key="forensic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="p-6 rounded-lg border text-center" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
                <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>Forensic Graph</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Network topology view of attack chain entities</p>
                <div className="mt-4 font-mono text-xs p-3 rounded border text-left" style={{ background: '#FFF1F0', borderColor: '#FECACA', color: '#E53935' }}>
                  SRC: {inc.src_ip} → TARGET: {inc.target}<br />
                  LAYER: {inc.layer.toUpperCase()} · TECHNIQUE: {inc.mitre_tag}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {(inc.history ?? []).length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>No actions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(inc.history ?? []).map((h, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#E53935' }} />
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#111827' }}>{h.action}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: '#9CA3AF' }}>{format(new Date(h.timestamp), 'MMM dd HH:mm:ss')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main Incidents Page ────────────────────────────────────────────────────────
export const Incidents = () => {
  const { incidents } = useStore();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pre-select from URL param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) setSelectedId(id);
  }, [searchParams]);

  const filters = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const matchFilter = filter === 'ALL' || inc.severity === filter;
      const matchSearch = !search || inc.type.includes(search.toUpperCase()) || inc.src_ip.includes(search) || inc.target.includes(search) || inc.mitre_tag.includes(search.toUpperCase());
      return matchFilter && matchSearch;
    });
  }, [incidents, filter, search]);

  const selected = incidents.find(i => i.id === selectedId) ?? null;

  return (
    <div className="h-full flex page-enter" style={{ background: '#FFFFFF' }}>

      {/* ── Left Panel (30%) ────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r" style={{ borderColor: '#E5E7EB' }}>
        {/* Header */}
        <div className="px-4 py-4 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-semibold text-sm" style={{ color: '#111827' }}>Threat Incident Pulse</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FFF1F0', color: '#E53935', border: '1px solid #FECACA' }}>
              {incidents.length} ACTIVE
            </span>
          </div>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none"
              style={{ background: '#F9FAFB', borderColor: '#E5E7EB', color: '#111827' }}
            />
          </div>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`filter-pill text-[10px] py-1 ${filter === f ? 'active' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-8 h-8 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
              <p className="text-xs" style={{ color: '#9CA3AF' }}>No incidents match</p>
            </div>
          ) : (
            filtered.map(inc => (
              <IncidentCard key={inc.id} inc={inc} isSelected={selectedId === inc.id} onClick={() => setSelectedId(inc.id)} />
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel (70%) ───────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selected ? (
            <InspectorErrorBoundary key={selected.id}>
              <IncidentDetail inc={selected} onClose={() => setSelectedId(null)} />
            </InspectorErrorBoundary>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F3F4F6' }}>
                <Search className="w-8 h-8" style={{ color: '#D1D5DB' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#374151' }}>No Incident Selected</h3>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Click an incident card on the left to view its AI Explanation</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
