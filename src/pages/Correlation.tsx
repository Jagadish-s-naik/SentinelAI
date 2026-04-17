import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { GitMerge, ArrowRight, Circle, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// ── Correlation Flow Diagram ───────────────────────────────────────────────────
function FlowDiagram() {
  const inputs = ['NETWORK LAYER', 'ENDPOINT LAYER', 'APPLICATION LAYER'];
  const outputs = ['INCIDENT EMIT', 'PLAYBOOK INVOKE'];

  return (
    <div className="k-card shadow-card p-6 dot-grid">
      <div className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: '#9CA3AF' }}>Cross-Layer Correlation Engine</div>
      <div className="flex items-center justify-center gap-6">
        {/* Inputs */}
        <div className="flex flex-col gap-3">
          {inputs.map(inp => (
            <div key={inp} className="px-4 py-2.5 rounded-lg border text-xs font-semibold text-center min-w-[140px]" style={{ background: '#fff', borderColor: '#E5E7EB', color: '#374151' }}>
              {inp}
            </div>
          ))}
        </div>

        {/* Arrow → Neural Core */}
        <div className="flex flex-col gap-3 items-center">
          {inputs.map((_, i) => (
            <ArrowRight key={i} className="w-5 h-5" style={{ color: '#D1D5DB' }} />
          ))}
        </div>

        {/* Neural Core */}
        <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-md border-2" style={{ background: '#FFF1F0', borderColor: '#E53935' }}>
          <GitMerge className="w-8 h-8 mb-1" style={{ color: '#E53935' }} />
          <span className="text-[10px] font-bold text-center leading-tight" style={{ color: '#E53935' }}>NEURAL<br />CORE</span>
        </div>

        {/* Arrow → Outputs */}
        <div className="flex flex-col gap-6 items-center">
          <ArrowRight className="w-5 h-5" style={{ color: '#D1D5DB' }} />
          <ArrowRight className="w-5 h-5" style={{ color: '#D1D5DB' }} />
        </div>

        {/* Outputs */}
        <div className="flex flex-col gap-6">
          {outputs.map(out => (
            <div key={out} className="px-4 py-2.5 rounded-lg border text-xs font-semibold text-center min-w-[140px]" style={{ background: '#FFF1F0', borderColor: '#FECACA', color: '#E53935' }}>
              {out}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Escalation Matrix ─────────────────────────────────────────────────────────
function EscalationMatrix() {
  const levels = [
    { id: 'L1', label: 'SINGLE VECTOR', sev: 'MEDIUM', desc: 'Isolated anomaly detected on a single layer. Auto-contained.' },
    { id: 'L2', label: 'MULTI-POINT', sev: 'HIGH', desc: 'Correlated events across 2+ layers. Escalation candidate.' },
    { id: 'L3', label: 'CONFIRMED FLOW', sev: 'CRITICAL', desc: 'Full kill-chain confirmed. Immediate SOC notification.' },
  ];
  const sevStyles: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium' };

  return (
    <div className="k-card shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>Logic Escalation Matrix</h2>
      </div>
      <div className="divide-y" style={{ divideColor: '#F3F4F6' }}>
        {levels.map(l => (
          <div key={l.id} className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0" style={{ background: '#FFF1F0', color: '#E53935' }}>
              {l.id}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs" style={{ color: '#111827' }}>{l.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sevStyles[l.sev]}`}>{l.sev}</span>
              </div>
              <p className="text-xs" style={{ color: '#6B7280' }}>{l.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Correlation ────────────────────────────────────────────────────────────────
export const Correlation = () => {
  const { incidents } = useStore();
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Build analyzer feed from incidents
  const analyzerFeed = useMemo(() => {
    return incidents.slice(0, 12).map(inc => ({
      id: inc.id.slice(0, 8),
      domain: inc.src_ip,
      layers: {
        network: inc.layer === 'network',
        endpoint: inc.layer === 'endpoint',
        application: inc.layer === 'application',
      },
      volume: Math.floor(Math.random() * 1800 + 200),
      risk: inc.severity,
      ttl: `${Math.floor(Math.random() * 280 + 20)}s`,
      incId: inc.id,
    }));
  }, [incidents]);

  const riskStyle = (r: string) => r === 'CRITICAL' ? 'badge-critical' : r === 'HIGH' ? 'badge-high' : r === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  return (
    <div className="p-6 space-y-6 page-enter">
      <FlowDiagram />

      {/* ── Analytical Analyzer Feed ─────────────────────── */}
      <div className="k-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>Analytical Analyzer Feed</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E53935' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Live</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                {['WINDOW ID', 'DOMAIN / IP', 'LAYER COVERAGE', 'VOLUME', 'RISK CLASSIFICATION', 'TTL'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: '#9CA3AF', fontSize: '10px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: '#F9FAFB' }}>
              {analyzerFeed.map(row => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRow(row.id === selectedRow ? null : row.id)}
                  className="cursor-pointer transition-colors"
                  style={{ background: selectedRow === row.id ? '#FFF1F0' : 'transparent' }}
                  onMouseEnter={e => { if (selectedRow !== row.id) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { if (selectedRow !== row.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold" style={{ color: selectedRow === row.id ? '#E53935' : '#374151' }}>
                      WIN-{row.id.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono" style={{ color: '#6B7280' }}>{row.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.layers.network ? '#E53935' : '#E5E7EB' }} title="Network" />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.layers.endpoint ? '#F59E0B' : '#E5E7EB' }} title="Endpoint" />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.layers.application ? '#3B82F6' : '#E5E7EB' }} title="Application" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#374151' }}>{row.volume.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${riskStyle(row.risk)}`}>{row.risk}</span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: '#9CA3AF' }}>{row.ttl}</td>
                </tr>
              ))}
              {analyzerFeed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs" style={{ color: '#9CA3AF' }}>
                    Awaiting correlation events…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EscalationMatrix />
    </div>
  );
};
