import { useState, useEffect } from 'react';
import { Eye, Cpu, ShieldAlert, Database, Check, Trash2, Download, RefreshCcw, Activity, Zap, Server, Bell } from 'lucide-react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../components/Layout';

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      className="w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0"
      style={{ background: value ? '#E53935' : '#E5E7EB' }}
    >
      <div
        className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm"
        style={{ left: value ? '24px' : '4px' }}
      />
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, icon: Icon }: { title: string; icon: typeof Eye }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4" style={{ color: '#E53935' }} />
      <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>{title}</h2>
    </div>
  );
}

// ── Settings Row ──────────────────────────────────────────────────────────────
function SettingsRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: '#F3F4F6' }}>
      <div>
        <div className="text-sm font-medium" style={{ color: '#111827' }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'ui' | 'engine' | 'threats' | 'integrations'>('ui');
  const { settings, updateSettings, clearIncidents, clearLogs, spawnManualIncident, incidents, rawLogs, backendStats, toggleAutoRemediation } = useStore();
  const [uiToggles, setUiToggles] = useState({ darkTheme: false, compactMode: false, alertSound: false });
  const [sensitivity, setSensitivity] = useState(75);
  const [attackLoading, setAttackLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as any;
    if (tab && ['ui', 'engine', 'threats', 'integrations'].includes(tab)) setActiveTab(tab);
  }, []);

  const tabs = [
    { id: 'ui' as const,           label: 'UI & Display',       icon: Eye },
    { id: 'engine' as const,       label: 'Core Engine',        icon: Cpu },
    { id: 'threats' as const,      label: 'Threat Simulation',  icon: ShieldAlert },
    { id: 'integrations' as const, label: 'Data Integrations',  icon: Database },
  ];

  const launchAttack = async (type: string, label: string) => {
    setAttackLoading(type);
    await new Promise(r => setTimeout(r, 1200));
    spawnManualIncident?.(type as any);
    setAttackLoading(null);
    showToast({ type: 'warning', title: 'Simulation Active', desc: `${label} attack scenario launched.` });
  };

  const attackScenarios = [
    { type: 'brute_force',       label: 'Brute Force SSH Attack',       desc: 'Simulates rapid auth attempts against SSH port 22', severity: 'CRITICAL' },
    { type: 'c2_beacon',         label: 'C2 Beacon Activity',           desc: 'Mimics Command & Control check-in patterns', severity: 'HIGH' },
    { type: 'lateral_movement',  label: 'Lateral Movement',             desc: 'Internal network pivoting via SMB/RDP', severity: 'HIGH' },
    { type: 'exfiltration',      label: 'Data Exfiltration Burst',      desc: 'Large volume data transfer to external host', severity: 'CRITICAL' },
  ];

  return (
    <div className="p-6 page-enter">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>System Configuration</h1>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Manage SentinelAI detection engine, integrations, and UI preferences</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#E5E7EB' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab.id ? '#E53935' : 'transparent',
              color: activeTab === tab.id ? '#E53935' : '#6B7280',
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── UI & Display ──────────────────────────────────── */}
        {activeTab === 'ui' && (
          <motion.div key="ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl">
            <div className="k-card p-6 shadow-card">
              <SectionHeader title="Display Preferences" icon={Eye} />
              <SettingsRow label="Dark Navy Theme" desc="Switch to dark cyberpunk mode (legacy style)">
                <Toggle value={uiToggles.darkTheme} onChange={v => { setUiToggles(p => ({ ...p, darkTheme: v })); showToast({ type: 'info', title: 'Theme updated', desc: v ? 'Dark mode preview (not applied).' : 'Light mode active.' }); }} />
              </SettingsRow>
              <SettingsRow label="Compact Mode" desc="Reduce card padding and font sizes for dense view">
                <Toggle value={uiToggles.compactMode} onChange={v => setUiToggles(p => ({ ...p, compactMode: v }))} />
              </SettingsRow>
              <SettingsRow label="Global Alert Sound" desc="Play audio notification on CRITICAL incidents">
                <Toggle value={uiToggles.alertSound} onChange={v => setUiToggles(p => ({ ...p, alertSound: v }))} />
              </SettingsRow>
              <SettingsRow label="Auto-Escalation" desc="Automatically escalate unresolved incidents after 1 hour">
                <Toggle value={settings.autoEscalation} onChange={v => updateSettings({ autoEscalation: v })} />
              </SettingsRow>
              <SettingsRow label="Business Hours Only" desc={`Alert suppression outside ${settings.businessHours.start}–${settings.businessHours.end}`}>
                <div className="flex items-center gap-2">
                  <input type="time" value={settings.businessHours.start} onChange={e => updateSettings({ businessHours: { ...settings.businessHours, start: e.target.value } })}
                    className="text-xs font-mono rounded border px-2 py-1 outline-none" style={{ borderColor: '#E5E7EB', color: '#374151' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>to</span>
                  <input type="time" value={settings.businessHours.end} onChange={e => updateSettings({ businessHours: { ...settings.businessHours, end: e.target.value } })}
                    className="text-xs font-mono rounded border px-2 py-1 outline-none" style={{ borderColor: '#E5E7EB', color: '#374151' }} />
                </div>
              </SettingsRow>
            </div>
          </motion.div>
        )}

        {/* ── Core Engine ───────────────────────────────────── */}
        {activeTab === 'engine' && (
          <motion.div key="engine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-5">
            {/* Telemetry Export */}
            <div className="k-card p-6 shadow-card">
              <SectionHeader title="Telemetry & Data" icon={Activity} />
              <div className="flex flex-wrap gap-3 mb-4">
                <button onClick={() => showToast({ type: 'success', title: 'Telemetry Exported', desc: `${incidents.length} incidents exported.` })} className="btn-ghost text-xs">
                  <Download className="w-3.5 h-3.5" /> Export Telemetry
                </button>
                <button onClick={() => { clearLogs(); showToast({ type: 'info', title: 'Logs cleared', desc: 'Raw log buffer flushed.' }); }} className="btn-ghost text-xs">
                  <RefreshCcw className="w-3.5 h-3.5" /> Clear Log Buffer
                </button>
                <button onClick={() => {
                  if (confirm('This will permanently delete all incidents. Are you sure?')) {
                    clearIncidents();
                    showToast({ type: 'error', title: 'All incidents wiped', desc: 'Action irreversible.' });
                  }
                }} className="btn-ghost text-xs" style={{ color: '#E53935', borderColor: '#FECACA' }}>
                  <Trash2 className="w-3.5 h-3.5" /> DANGER: WIPE ALL
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4 rounded-lg border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold" style={{ color: '#E53935' }}>{incidents.length}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Incidents</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold" style={{ color: '#374151' }}>{rawLogs.length}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Raw Logs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold" style={{ color: '#374151' }}>{backendStats?.processed_events?.toLocaleString() ?? '—'}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Processed</div>
                </div>
              </div>
            </div>

            {/* ML Models */}
            <div className="k-card p-6 shadow-card">
              <SectionHeader title="ML Model Toggles" icon={Cpu} />
              <SettingsRow label="Isolation Forest" desc="Anomaly detection via statistical outlier scoring">
                <Toggle value={settings.models.isolationForest} onChange={v => updateSettings({ models: { ...settings.models, isolationForest: v } })} />
              </SettingsRow>
              <SettingsRow label="XGBoost Classifier" desc="Gradient-boosted tree binary classification">
                <Toggle value={settings.models.xgboost} onChange={v => updateSettings({ models: { ...settings.models, xgboost: v } })} />
              </SettingsRow>
              <SettingsRow label="LSTM Time-Series" desc="Temporal sequence anomaly detection via RNN">
                <Toggle value={settings.models.lstm} onChange={v => updateSettings({ models: { ...settings.models, lstm: v } })} />
              </SettingsRow>
            </div>

            {/* Heuristic Sensitivity */}
            <div className="k-card p-6 shadow-card">
              <SectionHeader title="Heuristic Sensitivity" icon={Zap} />
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: '#374151' }}>Detection Threshold</span>
                <span className="font-mono font-bold text-sm" style={{ color: '#E53935' }}>{sensitivity}%</span>
              </div>
              <input type="range" min="10" max="100" value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))}
                className="w-full" />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
                <span>Low (more false positives)</span>
                <span>High (miss real threats)</span>
              </div>
            </div>

            {/* Auto-Remediation */}
            <div className="k-card p-6 shadow-card">
              <SectionHeader title="Auto-Remediation Engine" icon={Zap} />
              <SettingsRow
                label="Active Response Protocol"
                desc="Automatically block IPs and isolate endpoints upon detection"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${backendStats?.auto_remediation ? 'badge-low' : 'badge-critical'}`}>
                    {backendStats?.auto_remediation ? 'LIVE' : 'DISABLED'}
                  </span>
                  <Toggle value={!!backendStats?.auto_remediation} onChange={v => {
                    toggleAutoRemediation(v);
                    showToast({ type: v ? 'success' : 'warning', title: `Auto-Remediation ${v ? 'Enabled' : 'Disabled'}`, desc: 'Backend engine updated.' });
                  }} />
                </div>
              </SettingsRow>

              {/* Live Pipeline Stats */}
              {backendStats ? (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-lg text-center border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
                    <div className="text-lg font-mono font-bold" style={{ color: '#E53935' }}>{backendStats.eps?.toFixed(2) ?? '0.00'}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Events/sec</div>
                  </div>
                  <div className="p-3 rounded-lg text-center border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
                    <div className="text-lg font-mono font-bold" style={{ color: '#374151' }}>{(backendStats.processed_events ?? 0).toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Processed</div>
                  </div>
                  <div className="p-3 rounded-lg text-center border" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
                    <div className="text-lg font-mono font-bold" style={{ color: '#E53935' }}>{backendStats.mitigated_entities?.length ?? 0}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Blocked IPs</div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#E53935' }} />
                  Backend unreachable — start Python server on port 8001
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Threat Simulation ─────────────────────────────── */}
        {activeTab === 'threats' && (
          <motion.div key="threats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-5">
            <div className="k-card p-6 shadow-card">
              <SectionHeader title="Attack Scenario Simulator" icon={ShieldAlert} />
              <p className="text-xs mb-5" style={{ color: '#9CA3AF' }}>Launch controlled simulated attacks to validate pipeline detection and playbook responses.</p>
              <div className="grid grid-cols-2 gap-4">
                {attackScenarios.map(s => (
                  <div key={s.type} className="p-4 rounded-lg border" style={{ background: '#FAFAFA', borderColor: '#E5E7EB' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>{s.severity}</span>
                    </div>
                    <h3 className="font-semibold text-xs mb-1" style={{ color: '#111827' }}>{s.label}</h3>
                    <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>{s.desc}</p>
                    <button
                      onClick={() => launchAttack(s.type, s.label)}
                      disabled={attackLoading === s.type}
                      className="btn-primary text-xs w-full justify-center py-2"
                    >
                      {attackLoading === s.type ? '⟳ Launching...' : '▶ LAUNCH'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="k-card p-6 shadow-card">
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#111827' }}>Pipeline Stress Test</h3>
              <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Inject 20 randomized events across all layers simultaneously to validate throughput under load.</p>
              <button onClick={() => {
                Array.from({ length: 5 }).forEach((_, i) => setTimeout(() => spawnManualIncident?.('brute_force'), i * 200));
                showToast({ type: 'warning', title: 'Stress Test Running', desc: 'Injecting 20 events across all layers.' });
              }} className="btn-primary text-xs">
                ⚡ START STRESS TEST
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Data Integrations ─────────────────────────────── */}
        {activeTab === 'integrations' && (
          <motion.div key="int" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-4">
            {[
              {
                name: 'Supabase Realtime DB',
                icon: Database,
                status: 'CONNECTED',
                statusBadge: 'badge-low',
                desc: 'Production PostgreSQL store for incident persistence and cross-session history.',
                detail: 'Project: yefdzxsrewuwfpexhhue · Table: incidents',
              },
              {
                name: 'Local Log Ingester',
                icon: Server,
                status: 'WATCHING',
                statusBadge: 'badge-medium',
                desc: 'Backend FastAPI pipeline on port 8001 ingesting network/endpoint/application logs.',
                detail: backendStats ? `Active · ${backendStats.eps?.toFixed(2)} eps · ${backendStats.processed_events} events` : 'Offline — start main.py',
              },
              {
                name: 'CrowdStrike EDR',
                icon: ShieldAlert,
                status: 'PENDING',
                statusBadge: '',
                desc: 'Enterprise EDR integration via Falcon API for endpoint telemetry enrichment.',
                detail: 'API key not configured — add CROWDSTRIKE_KEY to .env',
              },
            ].map(int => (
              <div key={int.name} className="k-card p-5 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F3F4F6' }}>
                    <int.icon className="w-5 h-5" style={{ color: '#6B7280' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: '#111827' }}>{int.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${int.statusBadge || 'badge-medium'}`}
                        style={int.status === 'PENDING' ? { background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB' } : undefined}>
                        {int.status}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{int.desc}</p>
                    <p className="text-[11px] font-mono" style={{ color: '#9CA3AF' }}>{int.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
