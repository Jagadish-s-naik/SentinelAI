import { create } from 'zustand';
import type { RawLog, SecurityEvent, SystemSettings } from './types';

interface AppState {
  incidents: SecurityEvent[];
  rawLogs: RawLog[];
  settings: SystemSettings;
  simulationActive: boolean;
  addIncident: (incident: SecurityEvent) => void;
  addRawLog: (log: RawLog) => void;
  clearIncidents: () => void;
  clearLogs: () => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  toggleSimulation: () => void;
  pauseSimulation: (paused: boolean) => void;
  isPaused: boolean;
  resolveIncident: (id: string) => void;
  bulkResolveIncidents: (ids: string[]) => void;
  escalateIncident: (id: string) => void;
  bulkEscalateIncidents: (ids: string[]) => void;
  updateRemediation: (id: string, action: string) => void;
  activePlaybookId: string | null;
  setActivePlaybookId: (id: string | null) => void;
  spawnManualIncident: (type: 'ransomware' | 'c2' | 'exfil' | 'ddos') => void;
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
  autoEscalation: false,
};

export const useStore = create<AppState>((set) => ({
  incidents: [],
  rawLogs: [],
  settings: defaultSettings,
  simulationActive: false,
  isPaused: false,
  activePlaybookId: null,
  
  addIncident: (incident) => set((state) => ({
    incidents: [incident, ...state.incidents].slice(0, 1000)
  })),
  
  addRawLog: (log) => set((state) => ({
    rawLogs: [log, ...state.rawLogs].slice(0, 500)
  })),

  clearIncidents: () => set({ incidents: [] }),
  clearLogs: () => set({ rawLogs: [] }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  toggleSimulation: () => set((state) => ({
    simulationActive: !state.simulationActive
  })),

  pauseSimulation: (paused) => set({ isPaused: paused }),

  resolveIncident: (id) => set((state) => ({
    incidents: state.incidents.filter(inc => inc.id !== id),
    activePlaybookId: state.activePlaybookId === id ? null : state.activePlaybookId
  })),

  bulkResolveIncidents: (ids) => set((state) => ({
    incidents: state.incidents.filter(inc => !ids.includes(inc.id)),
    activePlaybookId: state.activePlaybookId && ids.includes(state.activePlaybookId) ? null : state.activePlaybookId
  })),

  escalateIncident: (id) => set((state) => ({
    incidents: state.incidents.map(inc => inc.id === id ? { ...inc, severity: 'CRITICAL' } : inc)
  })),

  bulkEscalateIncidents: (ids) => set((state) => ({
    incidents: state.incidents.map(inc => ids.includes(inc.id) ? { ...inc, severity: 'CRITICAL' } : inc)
  })),

  updateRemediation: (id, action) => set((state) => ({
    incidents: state.incidents.map(inc => {
      if (inc.id === id) {
        const history = inc.history || [];
        return { 
          ...inc, 
          status: 'MITIGATED',
          history: [...history, { action, timestamp: new Date().toISOString() }]
        };
      }
      return inc;
    })
  })),

  setActivePlaybookId: (id) => set(() => ({
    activePlaybookId: id
  })),

  spawnManualIncident: (type) => set((state) => {
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
    const newIncident: SecurityEvent = {
        id: `SIM-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...scenario,
        status: 'ACTIVE',
        history: [{ action: 'Simulated Injection', timestamp: new Date().toISOString() }]
    };

    return {
        incidents: [newIncident, ...state.incidents]
    };
  })
}));
