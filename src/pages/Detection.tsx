import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import type { RawLog } from '../types';
import { format } from 'date-fns';
import { Activity, Cpu, Network, Monitor, Globe, Circle } from 'lucide-react';

// ── Sparkline SVG ──────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#E53935' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 120; const H = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ── ML Model Card ──────────────────────────────────────────────────────────────
function ModelCard({ name, accuracy, status, delay }: { name: string; accuracy: string; status: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="k-card p-4 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" style={{ color: '#E53935' }} />
          <span className="text-xs font-semibold" style={{ color: '#111827' }}>{name}</span>
        </div>
        <span className="text-[10px] font-bold badge-low px-2 py-0.5 rounded">{status}</span>
      </div>
      <div className="text-2xl font-mono font-bold" style={{ color: '#E53935' }}>{accuracy}</div>
      <div className="text-[10px] mt-1 uppercase font-semibold tracking-wider" style={{ color: '#9CA3AF' }}>Accuracy Score</div>
    </motion.div>
  );
}

// ── Sparkline Stat ─────────────────────────────────────────────────────────────
function SparkCard({ label, value, data, delay }: { label: string; value: number; data: number[]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="k-card p-4 shadow-card"
    >
      <div className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: '#9CA3AF' }}>{label}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-mono font-bold" style={{ color: value > 0 ? '#E53935' : '#111827' }}>{value}</div>
        <Sparkline data={data} color={value > 0 ? '#E53935' : '#D1D5DB'} />
      </div>
    </motion.div>
  );
}

// ── Detection Engine ───────────────────────────────────────────────────────────
export const Detection = () => {
  const { rawLogs } = useStore();
  const [activeLayer, setActiveLayer] = useState<'NETWORK' | 'ENDPOINT' | 'APPLICATION'>('NETWORK');
  const [selectedLog, setSelectedLog] = useState<RawLog | null>(null);
  const [sparkHistory] = useState({
    brute: [12, 18, 25, 31, 47, 38, 42, 47],
    lateral: [0, 2, 0, 0, 1, 0, 0, 0],
    exfil: [8, 14, 22, 19, 28, 33, 36, 36],
    c2: [5, 8, 11, 14, 12, 15, 17, 17],
  });

  const layerMap: Record<string, 'network' | 'endpoint' | 'application'> = {
    NETWORK: 'network', ENDPOINT: 'endpoint', APPLICATION: 'application'
  };

  const filteredLogs = useMemo(() =>
    rawLogs.filter(l => l.layer === layerMap[activeLayer]).slice(0, 40),
    [rawLogs, activeLayer]
  );

  const layerIcons = { NETWORK: Network, ENDPOINT: Monitor, APPLICATION: Globe };

  return (
    <div className="p-6 space-y-6 page-enter">

      {/* ── ML Model Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <ModelCard name="Isolation Forest" accuracy="94.2%" status="OPERATIONAL" delay={0.05} />
        <ModelCard name="XGBoost Classifier" accuracy="96.8%" status="OPERATIONAL" delay={0.10} />
        <ModelCard name="LSTM Time-Series" accuracy="91.5%" status="OPERATIONAL" delay={0.15} />
      </div>

      {/* ── Sparkline Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <SparkCard label="BRUTE FORCE" value={47} data={sparkHistory.brute} delay={0.20} />
        <SparkCard label="LATERAL MOVEMENT" value={0} data={sparkHistory.lateral} delay={0.25} />
        <SparkCard label="DATA EXFILTRATION" value={36} data={sparkHistory.exfil} delay={0.30} />
        <SparkCard label="C2 BEACONING" value={17} data={sparkHistory.c2} delay={0.35} />
      </div>

      {/* ── Log Panel ───────────────────────────────────────── */}
      <div className="flex gap-4" style={{ height: '400px' }}>

        {/* Left: Ingress Pulse */}
        <div className="flex-1 k-card shadow-card flex flex-col overflow-hidden">
          {/* Layer Tab Bar */}
          <div className="flex border-b shrink-0" style={{ borderColor: '#E5E7EB' }}>
            {(['NETWORK', 'ENDPOINT', 'APPLICATION'] as const).map(layer => {
              const Icon = layerIcons[layer];
              return (
                <button
                  key={layer}
                  onClick={() => { setActiveLayer(layer); setSelectedLog(null); }}
                  className="flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors"
                  style={{
                    borderColor: activeLayer === layer ? '#E53935' : 'transparent',
                    color: activeLayer === layer ? '#E53935' : '#6B7280',
                    background: 'transparent',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {layer}
                </button>
              );
            })}
          </div>

          {/* Log Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ borderColor: '#F3F4F6', background: '#FAFAFA' }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E53935' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Ingress Pulse</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{filteredLogs.length} events</span>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: '#D1D5DB' }}>
                <Activity className="w-8 h-8 mb-2" />
                <p className="text-xs">No events on this layer</p>
              </div>
            ) : (
              filteredLogs.map((log: RawLog) => (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="w-full text-left px-4 py-2.5 border-b transition-colors hover:bg-gray-50 block"
                  style={{
                    borderColor: '#F3F4F6',
                    background: selectedLog?.id === log.id ? '#FFF1F0' : 'transparent',
                    borderLeft: selectedLog?.id === log.id ? '3px solid #E53935' : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] truncate flex-1" style={{ color: selectedLog?.id === log.id ? '#E53935' : '#374151' }}>
                      {log.raw.slice(0, 60)}{log.raw.length > 60 ? '…' : ''}
                    </span>
                    <span className="font-mono text-[10px] ml-3 shrink-0" style={{ color: '#9CA3AF' }}>
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Event Detail */}
        <div className="w-80 k-card shadow-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: '#E5E7EB', background: '#FAFAFA' }}>
            <h3 className="text-xs font-semibold" style={{ color: '#111827' }}>Event Detail</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {selectedLog ? (
                <motion.div key={selectedLog.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-2" style={{ color: '#9CA3AF' }}>Raw Event</div>
                    <div className="p-3 rounded-lg text-[11px] font-mono leading-relaxed break-all" style={{ background: '#FFF1F0', border: '1px solid #FECACA', color: '#E53935' }}>
                      {selectedLog.raw}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-2" style={{ color: '#9CA3AF' }}>Timestamp</div>
                    <div className="font-mono text-xs" style={{ color: '#374151' }}>{format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-2" style={{ color: '#9CA3AF' }}>Layer</div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold badge-medium">{selectedLog.layer.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold mb-2" style={{ color: '#9CA3AF' }}>Normalized Data</div>
                    <pre className="text-[10px] font-mono p-3 rounded-lg overflow-x-auto" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}>
                      {JSON.stringify(selectedLog.normalized, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Circle className="w-8 h-8 mb-3" style={{ color: '#D1D5DB' }} />
                  <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No event selected</p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Click a log entry to inspect it</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
