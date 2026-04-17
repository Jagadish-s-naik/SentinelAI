import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Crosshair, Link as LinkIcon, CheckCircle2, Shield, ChevronRight, Activity, Database, Cpu, Server } from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

// ── Kalvium Stat Card ─────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, accent, icon: Icon, delay, onClick }: {
  title: string; value: string | number; subtitle: string;
  accent: string; icon: typeof AlertTriangle; delay: number; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className="k-card p-5 flex items-center justify-between shadow-card"
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>{title}</p>
        <h3 className="text-3xl font-bold font-mono mb-1" style={{ color: accent }}>{value}</h3>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>{subtitle}</p>
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${accent}10` }}>
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
    </motion.div>
  );
}

// ── Severity Badge ─────────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: string }) {
  const cls = sev === 'CRITICAL' ? 'badge-critical' : sev === 'HIGH' ? 'badge-high' : sev === 'MEDIUM' ? 'badge-medium' : 'badge-low';
  return <span className={`${cls} text-[10px] px-2 py-0.5 rounded font-bold`}>{sev}</span>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { incidents, backendStats } = useStore();
  const navigate = useNavigate();

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const recentCount = incidents.filter(i => Date.now() - new Date(i.timestamp).getTime() < 3_600_000).length;
  const eps = backendStats?.eps ?? 0;
  const totalProcessed = backendStats?.processed_events ?? 0;
  const mitigatedCount = backendStats?.mitigated_entities?.length ?? 0;
  const layerDist = backendStats?.layer_distribution ?? { network: 0, endpoint: 0, api: 0 };
  const autoRem = backendStats?.auto_remediation ?? true;

  return (
    <div className="p-6 space-y-6 page-enter">

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Incidents" value={incidents.length} subtitle={`${recentCount} in the last hour`}
          accent="#E53935" icon={AlertTriangle} delay={0.05} onClick={() => navigate('/incidents')} />
        <StatCard title="Critical Alerts" value={criticalCount} subtitle="Requires immediate attention"
          accent="#E53935" icon={ShieldAlert} delay={0.1} onClick={() => navigate('/incidents?filter=Critical')} />
        <StatCard title="Pipeline EPS" value={eps > 0 ? `${eps.toFixed(1)}/s` : '—'} subtitle={`${totalProcessed.toLocaleString()} total processed`}
          accent="#111827" icon={Crosshair} delay={0.15} onClick={() => navigate('/settings?tab=engine')} />
        <StatCard title="Entities Blocked" value={mitigatedCount} subtitle="Auto-mitigated by Sentinel"
          accent="#111827" icon={LinkIcon} delay={0.2} onClick={() => navigate('/incidents')} />
      </div>

      {/* ── Main Panels ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left: Live Incident Feed (60%) */}
        <div className="flex-1 k-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#E53935' }} />
              <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>Live Incident Feed</h2>
            </div>
            <button onClick={() => navigate('/incidents')} className="text-xs flex items-center gap-1 font-semibold" style={{ color: '#E53935' }}>
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: '#D1D5DB' }}>
              <ShieldAlert className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">No incidents detected</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Pipeline is monitoring...</p>
            </div>
          ) : (
            <div className="divide-y" style={{ divideColor: '#F3F4F6' }}>
              {incidents.slice(0, 8).map((inc, idx) => (
                <motion.button
                  key={inc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate(`/incidents?id=${inc.id}`)}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                  <SevBadge sev={inc.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#111827' }}>
                      {inc.title || inc.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs font-mono mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                      {inc.src_ip} → {inc.target}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold" style={{ color: inc.confidence > 85 ? '#E53935' : '#6B7280' }}>
                      {inc.confidence}%
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      {formatDistanceToNow(new Date(inc.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Protections + Telemetry globe (40%) */}
        <div className="lg:w-80 flex flex-col gap-4">
          {/* Protections */}
          <div className="k-card p-5 shadow-card">
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#111827' }}>SentinelAI Active Protections</h2>
            <ul className="space-y-3">
              {[
                'Neural Network Traffic Analysis',
                'Advanced Endpoint Log Parsing',
                'Automated Playbook Generation',
                'MITRE ATT&CK Matrix Correlation',
                'Application Layer DPI',
                'Realtime Active Response',
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#6B7280' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <CheckCircle2 className="w-3 h-3" style={{ color: '#16A34A' }} />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Global Telemetry Card */}
          <div className="k-card flex-1 flex flex-col items-center justify-center p-6 shadow-card dot-grid relative overflow-hidden" style={{ minHeight: '160px' }}>
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF1F0', border: '2px solid #FECACA' }}>
                <Shield className="w-8 h-8" style={{ color: '#E53935' }} />
              </div>
              <h3 className="font-bold text-sm tracking-widest" style={{ color: '#111827' }}>GLOBAL TELEMETRY</h3>
              <p className="text-xs mt-1 tracking-widest" style={{ color: '#9CA3AF' }}>NODE · NETWORK · REALTIME OVERLAY</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Backend Telemetry Bar ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="k-card p-5 shadow-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: '#111827' }}>
            <span className={`w-2 h-2 rounded-full ${backendStats ? 'animate-pulse' : ''}`} style={{ background: backendStats ? '#22C55E' : '#E53935' }} />
            Live Backend Intelligence Feed
            <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>· polling every 5s</span>
          </h2>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${autoRem ? 'badge-low' : 'badge-critical'}`}>
            AUTO-REM: {autoRem ? 'ON' : 'OFF'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* EPS */}
          <div className="rounded-lg p-4 border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#9CA3AF' }}>Events/sec</span>
            </div>
            <div className="text-2xl font-mono font-bold" style={{ color: '#E53935' }}>{backendStats ? eps.toFixed(2) : '—'}</div>
            <div className="text-[10px] font-mono mt-1" style={{ color: '#9CA3AF' }}>{totalProcessed.toLocaleString()} total</div>
          </div>

          {/* Layer Split */}
          <div className="rounded-lg p-4 border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#9CA3AF' }}>Layer Split</span>
            </div>
            <div className="space-y-1.5">
              {(['network', 'endpoint', 'api'] as const).map(layer => {
                const total = layerDist.network + layerDist.endpoint + layerDist.api;
                const pct = total > 0 ? Math.round((layerDist[layer] / total) * 100) : 0;
                const colors: Record<string, string> = { network: '#E53935', endpoint: '#EA580C', api: '#3B82F6' };
                return (
                  <div key={layer} className="flex items-center gap-2">
                    <span className="text-[9px] font-mono w-14 capitalize" style={{ color: '#9CA3AF' }}>{layer}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[layer] }} />
                    </div>
                    <span className="text-[9px] font-mono w-6 text-right" style={{ color: '#6B7280' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ML Models */}
          <div className="rounded-lg p-4 border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#9CA3AF' }}>ML Models</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(backendStats?.active_models ?? ['xgboost', 'iso_forest', 'graph', 'lstm']).map((m: string) => (
                <span key={m} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Blocked IPs */}
          <div className="rounded-lg p-4 border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#9CA3AF' }}>Blocked IPs</span>
            </div>
            {backendStats?.mitigated_entities?.length > 0 ? (
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {backendStats.mitigated_entities.map((ip: string) => (
                  <div key={ip} className="text-[10px] font-mono flex items-center gap-1" style={{ color: '#E53935' }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#E53935' }} /> {ip}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] font-mono italic" style={{ color: '#9CA3AF' }}>
                {backendStats ? 'No entities blocked' : 'Backend offline'}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
