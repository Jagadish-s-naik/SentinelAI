export type LayerType = 'network' | 'endpoint' | 'application';
export type IncidentType = 'brute_force' | 'c2_beacon' | 'lateral_movement' | 'exfiltration';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ShapFeature {
  feature: string;
  value: number | string;
  contribution: number;
}

export interface IncidentHistory {
  action: string;
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  layer: LayerType;
  type: IncidentType;
  src_ip: string;
  target: string;
  confidence: number; // 0-100
  severity: SeverityLevel;
  mitre_tag: string;
  is_false_positive: boolean;
  shap_features: ShapFeature[];
  explanation: string;
  status?: 'ACTIVE' | 'MITIGATED' | 'RESOLVED';
  history?: IncidentHistory[];
}

export interface RawLog {
  id: string;
  timestamp: string;
  layer: LayerType;
  raw: string;
  normalized: object;
}

export interface SystemSettings {
  models: {
    isolationForest: boolean;
    xgboost: boolean;
    lstm: boolean;
  };
  correlationWindowMin: number;
  alertThreshold: number;
  falsePositiveSensitivity: 'Low' | 'Medium' | 'High';
  autoEscalation: boolean;
}
