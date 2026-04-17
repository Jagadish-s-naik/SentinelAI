import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { X } from 'lucide-react';

// ── MITRE ATT&CK Full Matrix Data ─────────────────────────────────────────────
const TACTICS = [
  { id: 'TA0001', name: 'Initial Access' },
  { id: 'TA0002', name: 'Execution' },
  { id: 'TA0003', name: 'Persistence' },
  { id: 'TA0006', name: 'Credential Access' },
  { id: 'TA0007', name: 'Discovery' },
  { id: 'TA0008', name: 'Lateral Movement' },
  { id: 'TA0010', name: 'Exfiltration' },
];

interface Technique {
  id: string;
  name: string;
  tactic: string;
  active?: boolean;
  hits?: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const TECHNIQUES: Technique[] = [
  // Initial Access
  { id: 'T1566', name: 'Phishing',            tactic: 'TA0001', hits: 8,  severity: 'HIGH' },
  { id: 'T1190', name: 'Exploit Public App',  tactic: 'TA0001', hits: 3,  severity: 'MEDIUM' },
  { id: 'T1133', name: 'External Remote Svc', tactic: 'TA0001', hits: 5,  severity: 'HIGH' },
  { id: 'T1195', name: 'Supply Chain Comp.',  tactic: 'TA0001', hits: 1,  severity: 'MEDIUM' },
  // Execution
  { id: 'T1059', name: 'Command & Scripting', tactic: 'TA0002', hits: 12, severity: 'HIGH' },
  { id: 'T1203', name: 'Exploit Client Exec', tactic: 'TA0002', hits: 4,  severity: 'HIGH' },
  { id: 'T1047', name: 'WMI',                 tactic: 'TA0002', hits: 2,  severity: 'MEDIUM' },
  { id: 'T1053', name: 'Scheduled Task/Job',  tactic: 'TA0002', hits: 6,  severity: 'HIGH' },
  // Persistence
  { id: 'T1547', name: 'Boot/Logon Autostart',tactic: 'TA0003', hits: 3,  severity: 'MEDIUM' },
  { id: 'T1543', name: 'Create/Modify Service',tactic:'TA0003', hits: 2,  severity: 'MEDIUM' },
  { id: 'T1098', name: 'Account Manipulation', tactic:'TA0003', hits: 7,  severity: 'HIGH' },
  { id: 'T1505', name: 'Server SW Component', tactic: 'TA0003', hits: 1,  severity: 'LOW' as any },
  // Credential Access
  { id: 'T1110', name: 'Brute Force',          tactic: 'TA0006', hits: 32, severity: 'CRITICAL', active: true },
  { id: 'T1555', name: 'Credentials Stores',   tactic: 'TA0006', hits: 4,  severity: 'HIGH' },
  { id: 'T1003', name: 'OS Credential Dump',   tactic: 'TA0006', hits: 6,  severity: 'HIGH' },
  { id: 'T1558', name: 'Steal Kerberos Ticket',tactic: 'TA0006', hits: 2,  severity: 'HIGH' },
  // Discovery
  { id: 'T1046', name: 'Network Svc Scan',     tactic: 'TA0007', hits: 15, severity: 'MEDIUM' },
  { id: 'T1018', name: 'Remote Sys Discovery', tactic: 'TA0007', hits: 8,  severity: 'MEDIUM' },
  { id: 'T1082', name: 'System Info Discovery',tactic: 'TA0007', hits: 4,  severity: 'LOW' as any },
  { id: 'T1083', name: 'File/Dir Discovery',   tactic: 'TA0007', hits: 5,  severity: 'LOW' as any },
  // Lateral Movement
  { id: 'T1021', name: 'Remote Services',      tactic: 'TA0008', hits: 9,  severity: 'HIGH' },
  { id: 'T1534', name: 'Internal Spearphish',  tactic: 'TA0008', hits: 2,  severity: 'MEDIUM' },
  { id: 'T1080', name: 'Taint Shared Content', tactic: 'TA0008', hits: 1,  severity: 'LOW' as any },
  // Exfiltration
  { id: 'T1041', name: 'Exfil Over C2',        tactic: 'TA0010', hits: 7,  severity: 'CRITICAL' },
  { id: 'T1048', name: 'Exfil Alt Protocol',   tactic: 'TA0010', hits: 3,  severity: 'HIGH' },
  { id: 'T1567', name: 'Exfil to Cloud',       tactic: 'TA0010', hits: 2,  severity: 'HIGH' },
];

function getTechniqueStyle(t: Technique, isSelected: boolean) {
  if (isSelected) return { background: '#FFF1F0', borderColor: '#E53935', color: '#E53935' };
  if (t.active)   return { background: '#FFF1F0', borderColor: '#E53935', color: '#E53935' };
  if (!t.hits) return { background: '#FAFAFA', borderColor: '#E5E7EB', color: '#374151' };
  if ((t.hits ?? 0) > 15) return { background: '#FFF1F0', borderColor: '#FECACA', color: '#E53935' };
  if ((t.hits ?? 0) > 5)  return { background: '#FFF7ED', borderColor: '#FED7AA', color: '#EA580C' };
  return { background: '#EFF6FF', borderColor: '#BFDBFE', color: '#3B82F6' };
}

// ── Detail Panel ───────────────────────────────────────────────────────────────
function TechniqueDetail({ tech, onClose }: { tech: Technique; onClose: () => void }) {
  const behaviors = [
    { label: 'Frequency', value: `${tech.hits ?? 0} hits in last 24h` },
    { label: 'MITRE ID', value: tech.id },
    { label: 'Tactic', value: TACTICS.find(t => t.id === tech.tactic)?.name ?? '' },
    { label: 'Severity', value: tech.severity ?? 'LOW' },
    { label: 'Last Seen', value: new Date().toLocaleTimeString() },
    { label: 'Status', value: tech.active ? 'ACTIVELY DETECTED' : 'HISTORICAL' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-80 shrink-0 border-l flex flex-col"
      style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#FFF1F0', color: '#E53935', border: '1px solid #FECACA' }}>{tech.id}</span>
            {tech.active && <span className="text-[10px] badge-critical px-2 py-0.5 rounded font-bold">ACTIVE</span>}
          </div>
          <h3 className="font-semibold text-sm" style={{ color: '#111827' }}>{tech.name}</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Behavior Analysis */}
        <div>
          <div className="text-[10px] uppercase font-bold mb-3" style={{ color: '#9CA3AF' }}>Behavior Analysis</div>
          <div className="space-y-2.5">
            {behaviors.map(b => (
              <div key={b.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                <span className="text-xs" style={{ color: '#6B7280' }}>{b.label}</span>
                <span className={`text-xs font-semibold font-mono ${b.label === 'Status' && tech.active ? '' : ''}`}
                  style={{ color: b.label === 'Status' && tech.active ? '#E53935' : '#111827' }}>
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hit Intensity Bar */}
        {(tech.hits ?? 0) > 0 && (
          <div>
            <div className="text-[10px] uppercase font-bold mb-2" style={{ color: '#9CA3AF' }}>Hit Intensity</div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((tech.hits ?? 0) / 35) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: tech.severity === 'CRITICAL' ? '#E53935' : tech.severity === 'HIGH' ? '#EA580C' : '#3B82F6' }}
              />
            </div>
            <div className="text-[10px] font-mono mt-1" style={{ color: '#9CA3AF' }}>{tech.hits} / 35 peak</div>
          </div>
        )}

        {/* Related Incidents hint */}
        <div className="p-3 rounded-lg border text-xs" style={{ background: '#F9FAFB', borderColor: '#E5E7EB', color: '#6B7280' }}>
          <strong style={{ color: '#111827' }}>Analyst Note: </strong>
          This technique was observed in {tech.hits} events. Cross-reference with Correlation engine for multi-vector chains.
        </div>
      </div>
    </motion.div>
  );
}

// ── MITRE Map ─────────────────────────────────────────────────────────────────
export const MitreMap = () => {
  const { incidents } = useStore();
  const [selectedTech, setSelectedTech] = useState<Technique | null>(null);

  // Enrich with live incident hits
  const enriched = useMemo(() => {
    return TECHNIQUES.map(t => {
      const liveHits = incidents.filter(i => i.mitre_tag === t.id).length;
      return { ...t, hits: (t.hits ?? 0) + liveHits };
    });
  }, [incidents]);

  const totalCoverage = Math.round((TECHNIQUES.length / 50) * 100);
  const activeTechniques = enriched.filter(t => t.hits > 0).length;
  const criticalHits = enriched.find(t => t.id === 'T1110')?.hits ?? 32;

  // Ticker alerts
  const tickerItems = enriched
    .filter(t => t.hits > 0)
    .sort((a, b) => (b.hits ?? 0) - (a.hits ?? 0))
    .slice(0, 8)
    .map(t => `${t.id} · ${t.name} · ${t.hits} HITS`);

  return (
    <div className="flex h-full page-enter" style={{ background: '#FFFFFF' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
          {/* Stat Row */}
          <div className="flex items-center gap-8 mb-4">
            {[
              { label: 'COVERAGE', value: `${totalCoverage}%` },
              { label: 'TECHNIQUES OBSERVED', value: activeTechniques },
              { label: 'CRITICAL HITS', value: criticalHits, accent: '#E53935' },
              { label: 'PEAK VECTOR', value: 'Credential Access' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#9CA3AF' }}>{s.label}</div>
                <div className="text-xl font-mono font-bold" style={{ color: (s as any).accent ?? '#111827' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Live Ticker */}
          {tickerItems.length > 0 && (
            <div className="ticker-wrap rounded-lg overflow-hidden" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', height: '32px' }}>
              <div className="ticker-inner flex items-center h-full">
                {[...tickerItems, ...tickerItems].map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-6 font-mono text-[11px] font-semibold h-full" style={{ color: '#EA580C' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Matrix */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${TACTICS.length}, minmax(120px, 1fr))` }}>
            {/* Tactic Headers */}
            {TACTICS.map(tac => (
              <div key={tac.id} className="text-center">
                <div className="px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: '#111827', color: '#FFFFFF' }}>
                  {tac.name}
                </div>
              </div>
            ))}

            {/* Technique Cells — per tactic column */}
            {TACTICS.map(tac => {
              const techs = enriched.filter(t => t.tactic === tac.id);
              return (
                <div key={tac.id} className="space-y-2">
                  {techs.map(tech => {
                    const isSelected = selectedTech?.id === tech.id;
                    const style = getTechniqueStyle(tech, isSelected);
                    return (
                      <button
                        key={tech.id}
                        onClick={() => setSelectedTech(isSelected ? null : tech)}
                        className="mitre-cell w-full text-left transition-all"
                        style={{
                          ...style,
                          fontWeight: isSelected || tech.active ? 600 : 400,
                          boxShadow: isSelected ? '0 0 0 2px #E53935' : undefined,
                        }}
                      >
                        <div className="font-mono text-[10px] mb-0.5" style={{ color: tech.active || isSelected ? '#E53935' : '#9CA3AF' }}>{tech.id}</div>
                        <div className="text-[10px] leading-tight">{tech.name}</div>
                        {(tech.hits ?? 0) > 0 && (
                          <div className="text-[9px] font-bold mt-1" style={{ color: style.color }}>{tech.hits} hits</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Detail Panel */}
      <AnimatePresence>
        {selectedTech && (
          <TechniqueDetail
            key={selectedTech.id}
            tech={selectedTech}
            onClose={() => setSelectedTech(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
