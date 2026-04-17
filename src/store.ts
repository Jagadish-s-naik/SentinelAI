import { create } from 'zustand';
import type { RawLog, SecurityEvent, SystemSettings } from './types';
import { supabase } from './supabase';

interface AppState {
  incidents: SecurityEvent[];
  rawLogs: RawLog[];
  settings: SystemSettings;
  simulationActive: boolean;
  isPaused: boolean;
  activePlaybookId: string | null;
  
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
  spawnManualIncident: (type: 'ransomware' | 'c2' | 'exfil' | 'ddos') => void;
  spawnCorrelationSignals: () => Promise<void>;
  runThroughputStressTest: () => Promise<void>;
  
  // Search State
  searchResults: {
    incidents: SecurityEvent[];
    techniques: { id: string; name: string }[];
  };
  setSearchQuery: (query: string) => void;
  
  // Initializers
  initialize: () => Promise<void>;
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
  searchResults: { incidents: [], techniques: [] },

  initialize: async () => {
    // Fetch initial data
    const [{ data: incidents }, { data: logs }, { data: settings }] = await Promise.all([
      supabase.from('incidents').select('*').order('timestamp', { ascending: false }).limit(100),
      supabase.from('raw_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      supabase.from('system_settings').select('*').single()
    ]);

    set({ 
      incidents: incidents || [], 
      rawLogs: logs || [],
      settings: settings ? { ...defaultSettings, ...settings as any } : defaultSettings
    });

    // Realtime Subscriptions
    supabase.channel('public:incidents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        
        if (eventType === 'INSERT') {
          set((state) => ({ incidents: [newRow as SecurityEvent, ...state.incidents].slice(0, 1000) }));
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
    await supabase.from('incidents').insert([incident]);
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
    await supabase.from('system_settings').update(updated).eq('id', 1);
  },
  
  toggleSimulation: () => set((state) => ({
    simulationActive: !state.simulationActive
  })),

  pauseSimulation: (paused) => set({ isPaused: paused }),

  resolveIncident: async (id) => {
    await supabase.from('incidents').delete().eq('id', id);
    if (get().activePlaybookId === id) set({ activePlaybookId: null });
  },

  bulkResolveIncidents: async (ids) => {
    await supabase.from('incidents').delete().in('id', ids);
    if (get().activePlaybookId && ids.includes(get().activePlaybookId!)) set({ activePlaybookId: null });
  },

  escalateIncident: async (id) => {
    await supabase.from('incidents').update({ severity: 'CRITICAL' }).eq('id', id);
  },

  bulkEscalateIncidents: async (ids) => {
    await supabase.from('incidents').update({ severity: 'CRITICAL' }).in('id', ids);
  },

  updateRemediation: async (id, action) => {
    const incident = get().incidents.find(inc => inc.id === id);
    if (incident) {
      const history = incident.history || [];
      const updatedHistory = [...history, { action, timestamp: new Date().toISOString() }];
      await supabase.from('incidents').update({ 
        status: 'MITIGATED',
        history: updatedHistory
      }).eq('id', id);
    }
  },

  setActivePlaybookId: (id) => set(() => ({
    activePlaybookId: id
  })),

  spawnManualIncident: (type) => {
    const scenarios: Record<string, Omit<SecurityEvent, 'id' | 'timestamp' | 'status' | 'history'>> = {
      ransomware: {
        type: 'exfiltration',
        layer: 'endpoint',
        severity: 'CRITICAL',
        explanation: 'Mass file modification and shadow copy deletion detected on HK-FINance-01.',
        mitre_tag: 'T1486',
        src_ip: '10.0.4.12',
        target: 'HK-FINance-01',
        confidence: 98,
        is_false_positive: false,
        shap_features: [
           { feature: 'file_io_count', value: '12,500/min', contribution: 0.88 },
           { feature: 'process_entropy', value: 7.9, contribution: 0.92 }
        ]
      },
      c2: {
        type: 'c2_beacon',
        layer: 'network',
        severity: 'HIGH',
        explanation: 'Consistent outbound telemetry observed to unlisted TLDs.',
        mitre_tag: 'T1071',
        src_ip: '45.18.29.102',
        target: 'Host-092',
        confidence: 92,
        is_false_positive: false,
        shap_features: [
           { feature: 'beacon_interval', value: '30s', contribution: 0.85 },
           { feature: 'tld_reputation', value: 'low', contribution: 0.77 }
        ]
      },
      exfil: {
        type: 'exfiltration',
        layer: 'endpoint',
        severity: 'CRITICAL',
        explanation: 'Unauthorized export of PII data via cloud-sync service.',
        mitre_tag: 'T1048',
        src_ip: '192.168.1.105',
        target: 'S3-Bucket-Prod',
        confidence: 99,
        is_false_positive: false,
        shap_features: [
           { feature: 'data_volume', value: '4.2GB', contribution: 0.95 },
           { feature: 'target_hostname', value: 'mega.nz', contribution: 0.81 }
        ]
      },
      ddos: {
        type: 'brute_force',
        layer: 'application',
        severity: 'HIGH',
        explanation: 'Syn flood and request saturation hitting public gateway.',
        mitre_tag: 'T1498',
        src_ip: '203.0.113.1',
        target: 'Public-Gateway-01',
        confidence: 88,
        is_false_positive: false,
        shap_features: [
           { feature: 'req_per_sec', value: '150k', contribution: 0.94 },
           { feature: 'cpu_load', value: '98%', contribution: 0.82 }
        ]
      }
    };

    const scenario = scenarios[type];
    const newIncident = {
        ...scenario,
        status: 'ACTIVE',
        history: [{ action: 'Simulated Injection', timestamp: new Date().toISOString() }]
    };

    supabase.from('incidents').insert([newIncident]).then(() => {});
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
        raw_data: { src_port: 443, proto: 'TCP' },
        normalized: { src_ip: testIp, dest_ip: '45.18.29.102', action: 'PORT_SCAN' }
      },
      {
        timestamp: new Date(new Date().getTime() + 1000).toISOString(),
        layer: 'endpoint',
        event_type: 'PROC_EXEC',
        severity: 'HIGH',
        raw_data: { binary: 'powershell.exe', args: '-enc ...' },
        normalized: { user: 'admin', src_ip: testIp, action: 'FILELESS_SHELL' }
      },
      {
        timestamp: new Date(new Date().getTime() + 2000).toISOString(),
        layer: 'application',
        event_type: 'API_ANOMALY',
        severity: 'CRITICAL',
        raw_data: { endpoint: '/v1/auth', method: 'POST' },
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
  }
}));

