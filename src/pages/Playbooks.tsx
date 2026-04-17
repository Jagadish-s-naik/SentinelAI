import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import type { SecurityEvent } from '../types';
import { BookOpen, Play, Check, AlertTriangle, Terminal, Loader2, ChevronRight } from 'lucide-react';
import { showToast } from '../components/Layout';

// ── Step types ─────────────────────────────────────────────────────────────────
type Phase = 'CONTAIN' | 'ERADICATE' | 'RECOVER';
interface PlaybookStep { id: number; phase: Phase; title: string; desc: string; done: boolean; }

function buildSteps(): PlaybookStep[] {
  return [
    { id: 1, phase: 'CONTAIN',   title: 'Isolate Source IP',          desc: 'Block the offending source IP at the perimeter firewall via ACL.', done: false },
    { id: 2, phase: 'CONTAIN',   title: 'Terminate Active Sessions',   desc: 'Kill all active network sessions from the identified source.', done: false },
    { id: 3, phase: 'CONTAIN',   title: 'Revoke Compromised Tokens',   desc: 'Invalidate all OAuth and API tokens associated with the entity.', done: false },
    { id: 4, phase: 'ERADICATE', title: 'Audit Authentication Logs',   desc: 'Review all auth logs from T-24h to identify lateral movement.', done: false },
    { id: 5, phase: 'ERADICATE', title: 'Patch Vulnerable Endpoint',   desc: 'Apply available security patches to the targeted service.', done: false },
    { id: 6, phase: 'ERADICATE', title: 'Remove Malicious Artifacts',  desc: 'Delete or quarantine identified malicious files and processes.', done: false },
    { id: 7, phase: 'RECOVER',   title: 'Restore Service Access',      desc: 'Gradually restore access with enhanced monitoring enabled.', done: false },
    { id: 8, phase: 'RECOVER',   title: 'Send Incident Closure Report', desc: 'Generate and distribute post-incident report to stakeholders.', done: false },
  ];
}

const phaseColors: Record<Phase, string> = { CONTAIN: '#E53935', ERADICATE: '#EA580C', RECOVER: '#16A34A' };
const phaseBg: Record<Phase, string>     = { CONTAIN: '#FFF1F0', ERADICATE: '#FFF7ED', RECOVER: '#F0FDF4' };

// ── Step Card ──────────────────────────────────────────────────────────────────
function StepCard({ step, delay }: { step: PlaybookStep; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3 p-4 rounded-lg border transition-all"
      style={{
        background: step.done ? `${phaseBg[step.phase]}` : '#FAFAFA',
        borderColor: step.done ? phaseColors[step.phase] + '60' : '#E5E7EB',
      }}
    >
      {/* Circle checkbox */}
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
        style={{
          borderColor: step.done ? phaseColors[step.phase] : '#D1D5DB',
          background: step.done ? phaseColors[step.phase] : 'transparent',
        }}
      >
        {step.done && <Check className="w-3 h-3 text-white" />}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: phaseBg[step.phase], color: phaseColors[step.phase] }}>
            {step.phase}
          </span>
          <span className="text-xs font-semibold" style={{ color: step.done ? phaseColors[step.phase] : '#111827' }}>{step.title}</span>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>{step.desc}</p>
      </div>
    </motion.div>
  );
}

// ── Playbooks ──────────────────────────────────────────────────────────────────
export const Playbooks = () => {
  const { incidents } = useStore();
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const [steps, setSteps] = useState<PlaybookStep[]>(buildSteps());
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[${new Date().toISOString()}] Playbook Commander v2.0 · Ready`,
    `[${new Date().toISOString()}] Awaiting orchestration target...`,
  ]);
  const [execVelocity, setExecVelocity] = useState(0);
  const [autonomyConf] = useState(94.2);

  const queuedIncidents = useMemo(() =>
    incidents.filter(i => i.status !== 'RESOLVED').slice(0, 10),
    [incidents]
  );

  const handleSelect = (inc: SecurityEvent) => {
    setSelected(inc);
    setSteps(buildSteps());
    setIsRunning(false);
    setExecVelocity(0);
    setConsoleLogs(prev => [
      ...prev,
      `[${new Date().toISOString()}] Target loaded: ${inc.type.replace(/_/g,' ')}_${inc.id.slice(0,6)}`,
      `[${new Date().toISOString()}] Severity: ${inc.severity} · Technique: ${inc.mitre_tag}`,
    ]);
  };

  const startOrchestration = () => {
    if (!selected || isRunning) return;
    setIsRunning(true);
    showToast({ type: 'success', title: 'Playbook Commander Initialized', desc: `Running ${selected.type.replace(/_/g,' ')} response plan.` });
    setConsoleLogs(prev => [...prev, `[${new Date().toISOString()}] ▶ ORCHESTRATION STARTED`]);

    steps.forEach((step, i) => {
      setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, done: true } : s));
        setExecVelocity(Math.round(((i + 1) / steps.length) * 100));
        setConsoleLogs(prev => [
          ...prev,
          `[${new Date().toISOString()}] ✔ Step ${step.id}: ${step.title}`
        ]);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setIsRunning(false);
            setConsoleLogs(prev => [...prev, `[${new Date().toISOString()}] ■ ORCHESTRATION COMPLETE`]);
            showToast({ type: 'success', title: 'Playbook Complete', desc: 'All 8 steps executed successfully.' });
          }, 400);
        }
      }, (i + 1) * 800);
    });
  };

  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="h-full flex page-enter" style={{ background: '#FFFFFF' }}>

      {/* ── Left Queue ──────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r" style={{ borderColor: '#E5E7EB' }}>
        <div className="px-4 py-4 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
          <h1 className="font-semibold text-sm mb-1" style={{ color: '#111827' }}>Response Queue</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{queuedIncidents.length} incidents awaiting playbook</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {queuedIncidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => handleSelect(inc)}
              className="w-full text-left p-3 rounded-lg border mb-2 transition-all block"
              style={{
                background: selected?.id === inc.id ? '#FFF1F0' : '#FAFAFA',
                borderColor: selected?.id === inc.id ? '#E53935' : '#E5E7EB',
                borderLeft: selected?.id === inc.id ? '3px solid #E53935' : '3px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${inc.severity === 'CRITICAL' ? 'badge-critical' : inc.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                  {inc.severity}
                </span>
                <ChevronRight className="w-3 h-3" style={{ color: '#D1D5DB' }} />
              </div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#111827' }}>{inc.type.replace(/_/g, ' ').toUpperCase()}</div>
              <div className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{inc.src_ip}</div>
              <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>{inc.mitre_tag}</div>
            </button>
          ))}
          {queuedIncidents.length === 0 && (
            <div className="text-center py-10 text-xs" style={{ color: '#9CA3AF' }}>
              <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
              No incidents queued
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Playbook Commander ────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge-${selected.severity.toLowerCase()} text-[10px] px-2 py-0.5 rounded font-bold`}>{selected.severity}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>{selected.mitre_tag}</span>
                </div>
                <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>
                  {selected.type.replace(/_/g, ' ').toUpperCase()} — Response Strategy
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {doneCount > 0 && (
                  <div className="text-xs font-mono" style={{ color: '#6B7280' }}>
                    {doneCount}/{steps.length} steps
                  </div>
                )}
                <button
                  onClick={startOrchestration}
                  disabled={isRunning || doneCount === steps.length}
                  className="btn-primary text-xs"
                >
                  {isRunning ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> RUNNING…</>
                  ) : doneCount === steps.length ? (
                    <><Check className="w-3.5 h-3.5" /> COMPLETE</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> START ORCHESTRATION</>
                  )}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Steps */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {/* Progress */}
                {execVelocity > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: '#6B7280' }}>Execution Velocity</span>
                      <span className="font-mono font-bold" style={{ color: '#E53935' }}>{execVelocity}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${execVelocity}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full rounded-full"
                        style={{ background: '#E53935' }}
                      />
                    </div>
                  </div>
                )}

                {steps.map((step, i) => <StepCard key={step.id} step={step} delay={i * 0.03} />)}

                {/* Escalation Warning */}
                <div className="mt-4 p-4 rounded-lg border" style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                    <div className="flex-1">
                      <div className="font-semibold text-xs mb-1" style={{ color: '#92400E' }}>Escalation Threshold</div>
                      <p className="text-xs" style={{ color: '#78350F' }}>
                        Autonomy Conf: <strong>{autonomyConf}%</strong>. If confidence drops below 80%, incident will be auto-escalated to Tier-2 SOC.
                      </p>
                    </div>
                    <button className="btn-ghost text-xs py-1.5 shrink-0" style={{ color: '#F59E0B', borderColor: '#FED7AA' }}>
                      MANUAL ESCALATION
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution Console */}
              <div className="w-72 flex flex-col border-l" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0" style={{ background: '#111827', borderColor: '#1F2937' }}>
                  <Terminal className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                  <span className="text-xs font-mono font-semibold" style={{ color: '#22C55E' }}>Execution Console</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 terminal-scroll" style={{ background: '#0D0D0D' }}>
                  {consoleLogs.map((log, i) => (
                    <div key={i} className="font-mono text-[10px] leading-relaxed mb-0.5" style={{ color: log.includes('✔') ? '#22C55E' : log.includes('▶') ? '#F59E0B' : log.includes('■') ? '#E53935' : '#9CA3AF' }}>
                      {log}
                    </div>
                  ))}
                  {isRunning && (
                    <div className="font-mono text-[10px] flex items-center gap-1 mt-1" style={{ color: '#F59E0B' }}>
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing…
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F3F4F6' }}>
              <BookOpen className="w-8 h-8" style={{ color: '#D1D5DB' }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: '#374151' }}>Playbook Commander</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Select an incident from the queue to load a response strategy</p>
          </div>
        )}
      </div>
    </div>
  );
};
