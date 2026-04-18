import { create } from 'zustand';
import type { RawLog, SecurityEvent, SystemSettings, IncidentType } from './types';
import { supabase } from './supabase';

interface AppState {
  incidents: SecurityEvent[];
  rawLogs: RawLog[];
  settings: SystemSettings;
  simulationActive: boolean;
  isPaused: boolean;
  activePlaybookId: string | null;
  activePlaybookSteps: any;
  backendStats: any;
  
  // Actions
  addIncident: (incident: Omit<SecurityEvent, 'id' | 'timestamp'>) => Promise<void>;
  addRawLog: (log: Omit<RawLog, 'id' | 'timestamp'>) => Promise<void>;
  clearIncidents: () => Promise<void>;
  clearLogs: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  toggleSimulation: () => void;
  pauseSimulation: (paused: boolean) => void;
  resolveIncident: (id: string) => Promise<void>;
  bulkResolveIncidents: (ids: string[]) => Promise<void>;
  escalateIncident: (id: string) => Promise<void>;
  bulkEscalateIncidents: (ids: string[]) => Promise<void>;
  updateRemediation: (id: string, action: string) => Promise<void>;
  setActivePlaybookId: (id: string | null) => void;
  spawnManualIncident: (type: IncidentType) => Promise<void>;
  fetchPlaybook: (incidentId: string) => Promise<void>;
  triggerSimulation: (scenarioId: string) => Promise<void>;
  spawnCorrelationSignals: () => Promise<void>;
  runThroughputStressTest: () => Promise<void>;
  fetchBackendIncidents: () => Promise<void>;
  
  // Search State
  searchResults: {
    incidents: SecurityEvent[];
    techniques: { id: string; name: string }[];
  };
  setSearchQuery: (query: string) => void;
  
  // Initializers
  initialize: () => Promise<void>;
  fetchStats: () => Promise<void>;
  toggleAutoRemediation: (enabled: boolean) => Promise<void>;
  injectManualLog: (raw: string, layer?: string) => Promise<void>;
  exportTelemetry: () => void;
}

const defaultSettings: SystemSettings = {
  models: {
    isolationForest: true,
    xgboost: true,
    lstm: true,
  },
  correlationWindowMin: 5,
  alertThreshold: 75,
  falsePositiveSensitivity: 'Medium',
  businessHours: {
    start: '09:00',
    end: '18:00'
  },
  autoEscalation: false,
};

export const useStore = create<AppState>((set, get) => ({
  incidents: [],
  rawLogs: [],
  settings: defaultSettings,
  simulationActive: false,
  isPaused: false,
  activePlaybookId: null,
  activePlaybookSteps: null,
  backendStats: null,
  searchResults: { incidents: [], techniques: [] },

  initialize: async () => {
    // Fetch initial data from backend (primary) and Supabase (secondary)
    const fetchAndMerge = async () => {
      // Backend incidents always take priority (in-memory, no DB dependency)
      let backendIncidents: SecurityEvent[] = [];
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        const res = await fetch(`${API_URL}/incidents?limit=200`);
        const data = await res.json();
        backendIncidents = data.incidents || [];
      } catch (e) {
        console.debug('[STORE] Backend incident fetch failed, using Supabase only');
      }

      // Supabase as secondary/fallback persistence layer
      let supabaseIncidents: SecurityEvent[] = [];
      try {
        const { data } = await supabase.from('incidents').select('*').order('timestamp', { ascending: false }).limit(100);
        supabaseIncidents = data || [];
      } catch (e) {
        console.debug('[STORE] Supabase incident fetch failed');
      }

      // Merge: backend takes priority, fill in any from Supabase not already in backend
      const backendIds = new Set(backendIncidents.map(i => i.id));
      const merged = [
        ...backendIncidents,
        ...supabaseIncidents.filter(i => !backendIds.has(i.id))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      set({ incidents: merged.slice(0, 500) });
    };

    await fetchAndMerge();

    // Fetch logs and settings
    const [{ data: logs }, { data: settings }] = await Promise.all([
      supabase.from('raw_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      supabase.from('system_settings').select('*').single()
    ]);

    set({
      rawLogs: logs || [],
      settings: settings ? { ...defaultSettings, ...settings as any } : defaultSettings
    });

    // Initial stats fetch
    await get().fetchStats();
    
    // Poll backend incidents every 3 seconds (primary real-time source)
    setInterval(() => {
      get().fetchBackendIncidents();
    }, 3000);

    // Also poll backend stats every 5s
    setInterval(() => {
      get().fetchStats();
    }, 5000);

    // Realtime Subscriptions (Supabase secondary)
    supabase.channel('public:incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        
        if (eventType === 'INSERT') {
          set((state) => {
            const exists = state.incidents.some(i => i.id === (newRow as SecurityEvent).id);
            if (exists) return state;
            return { incidents: [newRow as SecurityEvent, ...state.incidents].slice(0, 1000) };
          });
        } else if (eventType === 'UPDATE') {
          set((state) => ({ 
            incidents: state.incidents.map(inc => inc.id === newRow.id ? (newRow as SecurityEvent) : inc) 
          }));
        } else if (eventType === 'DELETE') {
          set((state) => ({ incidents: state.incidents.filter(inc => inc.id !== oldRow.id) }));
        }
      })
      .subscribe();

    supabase.channel('public:raw_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'raw_logs' }, (payload) => {
        set((state) => ({ rawLogs: [payload.new as RawLog, ...state.rawLogs].slice(0, 500) }));
      })
      .subscribe();

    supabase.channel('public:system_settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings' }, (payload) => {
        set({ settings: payload.new as SystemSettings });
      })
      .subscribe();
  },
  
  addIncident: async (incident) => {
    // Try Supabase first, fallback gracefully
    try {
      await supabase.from('incidents').insert([incident]);
    } catch (e) {
      console.debug('[STORE] addIncident Supabase fallback, using backend only');
    }
  },

  fetchBackendIncidents: async () => {
    try {
      const res = await fetch('http://localhost:8001/incidents?limit=200');
      const data = await res.json();
      const backendIncidents: SecurityEvent[] = data.incidents || [];
      if (backendIncidents.length === 0) return;

      set((state) => {
        const backendIds = new Set(backendIncidents.map(i => i.id));
        const supabaseOnly = state.incidents.filter(i => !backendIds.has(i.id));
        const merged = [...backendIncidents, ...supabaseOnly]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        // Only update state if something actually changed
        if (merged.length === state.incidents.length && 
            merged[0]?.id === state.incidents[0]?.id) return state;
        return { incidents: merged.slice(0, 500) };
      });
    } catch (e) {
      // Backend unreachable — no-op, keep existing state
    }
  },
  
  addRawLog: async (log) => {
    await supabase.from('raw_logs').insert([log]);
  },

  clearIncidents: async () => {
    await supabase.from('incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  },

  clearLogs: async () => {
    await supabase.from('raw_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  },
  
  updateSettings: async (newSettings) => {
    const { settings } = get();
    const updated = { ...settings, ...newSettings };
    
    // 1. Persist to Supabase (User preferences)
    await supabase.from('system_settings').update(updated).eq('id', 1);
    
    // 2. Sync with Backend Engine (Requirement 3: Dynamic Posting)
    try {
        const activeModels = [];
        if (updated.models.isolationForest) activeModels.push('isolation_forest');
        if (updated.models.xgboost) activeModels.push('xgboost');
        if (updated.models.lstm) activeModels.push('lstm');

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        await fetch(`${API_URL}/settings/engine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                active_models: activeModels,
                alert_threshold: updated.alertThreshold
            })
        });
    } catch (e) {
        console.error('[STORE] Failed to sync engine settings:', e);
    }

    set({ settings: updated });
  },
  
  toggleSimulation: () => set((state) => ({
    simulationActive: !state.simulationActive
  })),

  pauseSimulation: (paused) => set({ isPaused: paused }),

  resolveIncident: async (id) => {
    // Optimistic local update
    set((state) => ({ incidents: state.incidents.filter(inc => inc.id !== id) }));
    if (get().activePlaybookId === id) set({ activePlaybookId: null });
    // Backend sync
    try { await fetch(`http://localhost:8001/incidents/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'RESOLVED' }) }); } catch {}
    // Supabase best-effort
    try { await supabase.from('incidents').delete().eq('id', id); } catch {}
  },

  bulkResolveIncidents: async (ids) => {
    set((state) => ({ incidents: state.incidents.filter(inc => !ids.includes(inc.id)) }));
    if (get().activePlaybookId && ids.includes(get().activePlaybookId!)) set({ activePlaybookId: null });
    // Backend sync (parallel)
    await Promise.allSettled(ids.map(id =>
      fetch(`http://localhost:8001/incidents/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'RESOLVED' }) })
    ));
    try { await supabase.from('incidents').delete().in('id', ids); } catch {}
  },

  escalateIncident: async (id) => {
    // Optimistic local update
    set((state) => ({ incidents: state.incidents.map(inc => inc.id === id ? { ...inc, severity: 'CRITICAL' } : inc) }));
    // Backend sync
    try { await fetch(`http://localhost:8001/incidents/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ severity: 'CRITICAL' }) }); } catch {}
    // Supabase best-effort
    try { await supabase.from('incidents').update({ severity: 'CRITICAL' }).eq('id', id); } catch {}
  },

  bulkEscalateIncidents: async (ids) => {
    set((state) => ({ incidents: state.incidents.map(inc => ids.includes(inc.id) ? { ...inc, severity: 'CRITICAL' } : inc) }));
    await Promise.allSettled(ids.map(id =>
      fetch(`http://localhost:8001/incidents/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ severity: 'CRITICAL' }) })
    ));
    try { await supabase.from('incidents').update({ severity: 'CRITICAL' }).in('id', ids); } catch {}
  },

  updateRemediation: async (id, action) => {
    const incident = get().incidents.find(inc => inc.id === id);
    if (incident) {
      const history = incident.history || [];
      const updatedHistory = [...history, { action, timestamp: new Date().toISOString() }];
      const update = { status: 'MITIGATED' as const, history: updatedHistory };
      // Optimistic local update first
      set((state) => ({
        incidents: state.incidents.map(inc => inc.id === id ? { ...inc, ...update } : inc)
      }));
      // Backend sync
      try { await fetch(`http://localhost:8001/incidents/${id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(update) }); } catch {}
      // Supabase best-effort
      try { await supabase.from('incidents').update(update).eq('id', id); } catch {}
    }
  },

  setActivePlaybookId: (id) => {
    set({ activePlaybookId: id, activePlaybookSteps: null });
    if (id) get().fetchPlaybook(id);
  },

  spawnManualIncident: async (type) => {
    // Mapping from UI types to simulator scenario_ids
    const scenarioMap: Record<string, string> = {
        ransomware: 'brute_force',
        c2: 'c2_beacon',
        exfil: 'admin_fp',
        ddos: 'dataset_seed',
        brute_force: 'brute_force',
        c2_beacon: 'c2_beacon',
        lateral_movement: 'dataset_seed', // Scanning patterns
        exfiltration: 'admin_fp'          // Large data transfer
    };
    const bid = scenarioMap[type] || 'brute_force';
    await get().triggerSimulation(bid);
  },

  triggerSimulation: async (scenarioId) => {
    try {
        await fetch(`${import.meta.env.VITE_API_URL}/simulate/${scenarioId}`, { method: 'POST' });
        console.log(`[SIM] Triggered ${scenarioId}`);
    } catch (e) {
        console.error('Simulation trigger failed:', e);
    }
  },

  fetchPlaybook: async (incidentId) => {
    try {
        const res = await fetch(`http://localhost:8001/playbook/${incidentId}`);
        const data = await res.json();
        if (data.steps) {
            // Map backend steps to frontend format
            const steps = [
                ...data.steps.containment.map((s: string, i: number) => ({ id: `c${i}`, phase: 'CONTAIN', action: s, command: 'auto-isolator --apply' })),
                ...data.steps.eradication.map((s: string, i: number) => ({ id: `e${i}`, phase: 'ERADICATE', action: s, command: 'clean-agent --deep' })),
                ...data.steps.recovery.map((s: string, i: number) => ({ id: `r${i}`, phase: 'RECOVER', action: s, command: 'sys-restore --validate' }))
            ];
            set({ activePlaybookSteps: steps });
        }
    } catch (e) {
        console.error('Playbook fetch failed:', e);
    }
  },

  spawnCorrelationSignals: async () => {
    const testIp = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
    const timestamp = new Date().toISOString();

    const logs: Omit<RawLog, 'id'>[] = [
      {
        timestamp,
        layer: 'network',
        event_type: 'CONNECTION_ATTP',
        severity: 'MEDIUM',
        raw: JSON.stringify({ src_port: 443, proto: 'TCP' }),
        normalized: { src_ip: testIp, dest_ip: '45.18.29.102', action: 'PORT_SCAN' }
      },
      {
        timestamp: new Date(new Date().getTime() + 1000).toISOString(),
        layer: 'endpoint',
        event_type: 'PROC_EXEC',
        severity: 'HIGH',
        raw: JSON.stringify({ binary: 'powershell.exe', args: '-enc ...' }),
        normalized: { user: 'admin', src_ip: testIp, action: 'FILELESS_SHELL' }
      },
      {
        timestamp: new Date(new Date().getTime() + 2000).toISOString(),
        layer: 'application',
        event_type: 'API_ANOMALY',
        severity: 'CRITICAL',
        raw: JSON.stringify({ endpoint: '/v1/auth', method: 'POST' }),
        normalized: { src_ip: testIp, action: 'CREDENTIAL_STUFFING', target: 'Sentinel-Vault' }
      }
    ];

    await supabase.from('raw_logs').insert(logs);
  },

  setSearchQuery: (query: string) => {
    if (!query) {
      set({ searchResults: { incidents: [], techniques: [] } });
      return;
    }

    const { incidents } = get();
    const q = query.toLowerCase();

    // Mock search for now - could be extended with dedicated indexing
    const filteredIncidents = incidents.filter(i => 
      i.id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) || 
      i.src_ip.includes(q) || 
      i.mitre_tag.toLowerCase().includes(q)
    );

    // Common MITRE techniques for search - expanded for production
    const techniques = [
      { id: 'T1059', name: 'Command and Scripting Interpreter' },
      { id: 'T1071', name: 'Application Layer Protocol' },
      { id: 'T1566', name: 'Phishing' },
      { id: 'T1003', name: 'OS Credential Dumping' },
      { id: 'T1021', name: 'Remote Services' },
      { id: 'T1053', name: 'Scheduled Task/Job' },
      { id: 'T1048', name: 'Exfiltration Over Alternative Protocol' },
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1486', name: 'Data Encrypted for Impact' },
      { id: 'T1134', name: 'Access Token Manipulation' }
    ].filter(t => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));

    set({ searchResults: { incidents: filteredIncidents, techniques } });
  },

  runThroughputStressTest: async () => {
    // 500 events/sec burst test
    // We send batches to remain within Supabase limits while simulating high load
    const batchSize = 50;
    const intervals = 10; // 0.1s intervals * 10 = 1s total for 500 events
    
    for (let i = 0; i < intervals; i++) {
        const testIp = `172.16.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
        const logs: Omit<RawLog, 'id'>[] = Array.from({ length: batchSize }).map((_, j) => ({
            timestamp: new Date().toISOString(),
            layer: j % 3 === 0 ? 'network' : j % 3 === 1 ? 'endpoint' : 'application',
            event_type: 'STRESS_INGEST',
            severity: 'LOW',
            raw: `STRESS_TEST_EVENT_${i}_${j}`,
            normalized: { 
                src_ip: testIp, 
                action: 'STRESS_BURST',
                entropy: Math.random()
            }
        }));

        await supabase.from('raw_logs').insert(logs);
        await new Promise(r => setTimeout(r, 100)); // 100ms throttle
    }
  },

  fetchStats: async () => {
    try {
        const statsRes = await fetch('http://localhost:8001/stats');
        const stats = await statsRes.json();
        set({ backendStats: stats });
    } catch (e) {
        console.debug('Backend unreachable for stats:', (e as Error).message);
        // We don't reset backendStats to null to avoid UI flickering during transient disconnects
    }
  },

  toggleAutoRemediation: async (enabled: boolean) => {
    try {
      await fetch(`http://localhost:8001/settings/protection?enabled=${enabled}`, { method: 'POST' });
      // Optimistically update local backendStats
      set((state) => ({
        backendStats: state.backendStats ? { ...state.backendStats, auto_remediation: enabled } : state.backendStats
      }));
      // Re-fetch to confirm
      await useStore.getState().fetchStats();
    } catch (e) {
      console.error('[STORE] toggleAutoRemediation failed:', e);
    }
  },

  injectManualLog: async (raw: string, layer = 'network') => {
    try {
      await fetch('http://localhost:8001/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw, layer })
      });
    } catch (e) {
      console.error('[STORE] injectManualLog failed:', e);
    }
  },

  exportTelemetry: () => {
    const { incidents, rawLogs } = get();
    const payload = {
        exportDate: new Date().toISOString(),
        metadata: {
            system: "SentinelAI-Core",
            version: "2.0.0-PROD"
        },
        incidents: incidents.map(i => ({ ...i, shap_features: undefined })), // Prune SHAP for export
        rawLogs: rawLogs.slice(0, 100)
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinel_forensic_export_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
}));

