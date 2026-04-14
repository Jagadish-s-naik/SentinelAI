import type { LayerType } from '../types';
import { useStore } from '../store';

const generateRandomIP = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

export const startSimulationEngine = () => {

  const generateBruteForce = () => {
    if (useStore.getState().isPaused) return;
    const isFP = Math.random() > 0.8;
    const event: any = {
      layer: 'network',
      type: 'brute_force',
      src_ip: '192.168.1.' + Math.floor(Math.random() * 255),
      target: 'Auth_Gateway_01',
      confidence: Math.floor(Math.random() * 20 + 80), // 80-100
      severity: isFP ? 'MEDIUM' : 'HIGH',
      mitre_tag: 'T1110',
      is_false_positive: isFP,
      status: 'ACTIVE',
      history: [],
      shap_features: [
        { feature: 'login_failure_rate', value: '45/min', contribution: 0.82 },
        { feature: 'ip_reputation_score', value: 45, contribution: 0.71 },
        { feature: 'requests_per_minute', value: 120, contribution: 0.68 },
        { feature: 'geo_anomaly', value: 'ru', contribution: 0.45 },
        { feature: 'time_of_day', value: '03:15 AM', contribution: 0.23 },
        { feature: 'user_agent_entropy', value: 2.1, contribution: -0.12 },
      ],
      explanation: isFP ? "Repeated failed logins matched known internal scanner." : "High volume of failed login attempts detected clustered from a single subnet.",
    };
    useStore.getState().addIncident(event);
  };

  const generateC2Beacon = () => {
    if (useStore.getState().isPaused) return;
    const event: any = {
      layer: 'network',
      type: 'c2_beacon',
      src_ip: 'host-092',
      target: '93.184.33.' + Math.floor(Math.random() * 255),
      confidence: Math.floor(Math.random() * 10 + 90), 
      severity: 'CRITICAL',
      mitre_tag: 'T1071',
      is_false_positive: false,
      status: 'ACTIVE',
      history: [],
      shap_features: [
        { feature: 'connection_interval_regularity', value: '0.98', contribution: 0.91 },
        { feature: 'bytes_per_connection', value: '45b', contribution: 0.64 },
        { feature: 'destination_ip_reputation', value: 12, contribution: 0.78 },
        { feature: 'connection_duration', value: '1.2s', contribution: 0.52 },
        { feature: 'port_number', value: 4444, contribution: 0.38 },
        { feature: 'dns_query_frequency', value: 'low', contribution: -0.15 },
      ],
      explanation: "Highly regular outbound connections detected resembling command and control beaconing behavior.",
    };
    useStore.getState().addIncident(event);
  };

  const generateExfiltration = () => {
    if (useStore.getState().isPaused) return;
    const isFP = true; // explicitly making it frequently a FP as per requirements
    const event: any = {
      layer: 'endpoint',
      type: 'exfiltration',
      src_ip: '10.0.5.44',
      target: 'admin@corp.net',
      confidence: Math.floor(Math.random() * 20 + 60), 
      severity: 'HIGH',
      mitre_tag: 'T1048',
      is_false_positive: isFP,
      status: 'ACTIVE',
      history: [],
      shap_features: [
        { feature: 'bytes_transferred_outbound', value: '4.2GB', contribution: 0.88 },
        { feature: 'transfer_frequency', value: 'burst', contribution: 0.74 },
        { feature: 'destination_geo', value: 'us', contribution: 0.65 },
        { feature: 'time_of_transfer', value: '14:22 PM', contribution: 0.41 },
        { feature: 'user_role', value: 'sysadmin', contribution: -0.35 },
        { feature: 'historical_baseline_delta', value: '400%', contribution: 0.59 },
      ],
      explanation: "Large outbound transfer detected, but originating from known admin account during business hours.",
    };
    useStore.getState().addIncident(event);
  };

  const generateAccountDiscovery = () => {
    if (useStore.getState().isPaused) return;
    const event: any = {
      layer: 'endpoint',
      type: 'lateral_movement',
      src_ip: '10.0.' + Math.floor(Math.random() * 255) + '.12',
      target: 'LDAP-Controller-PROD',
      confidence: Math.floor(Math.random() * 15 + 75), 
      severity: 'MEDIUM',
      mitre_tag: 'T1087',
      is_false_positive: false,
      status: 'ACTIVE',
      history: [],
      shap_features: [
        { feature: 'ldap_query_volume', value: 'high', contribution: 0.82 },
        { feature: 'unique_account_lookups', value: '145', contribution: 0.74 },
        { feature: 'process_name', value: 'net.exe', contribution: 0.65 },
      ],
      explanation: "Unusual volume of account discovery queries detected from a workstation targeting the domain controller.",
    };
    useStore.getState().addIncident(event);
  };

  const generateNetworkDoS = () => {
    if (useStore.getState().isPaused) return;
    const event: any = {
      layer: 'network',
      type: 'brute_force',
      src_ip: '45.18.' + Math.floor(Math.random() * 255) + '.10',
      target: 'Public-Facing-API-Gateway',
      confidence: Math.floor(Math.random() * 10 + 90), 
      severity: 'CRITICAL',
      mitre_tag: 'T1498',
      is_false_positive: false,
      status: 'ACTIVE',
      history: [],
      shap_features: [
        { feature: 'pps_delta', value: '1.2M/sec', contribution: 0.94 },
        { feature: 'syn_flood_ratio', value: '0.88', contribution: 0.88 },
        { feature: 'latency_impact', value: '+4500ms', contribution: 0.81 },
      ],
      explanation: "Layer 4 SYN flood detected targeting the public API gateway, causing significant latency spikes.",
    };
    useStore.getState().addIncident(event);
  };

  // Run the intervals
  setInterval(() => {
    if (Math.random() > 0.5) generateBruteForce();
  }, 4000); // Between 3-8s effectively if randomized

  setInterval(() => {
    if (Math.random() > 0.7) generateC2Beacon();
  }, 7000);

  setInterval(() => {
    if (Math.random() > 0.6) generateExfiltration();
  }, 9000);

  setInterval(() => {
    if (Math.random() > 0.8) generateAccountDiscovery();
  }, 12000);

  setInterval(() => {
    if (Math.random() > 0.9) generateNetworkDoS();
  }, 15000);

  // Generate generic raw logs frequently
  setInterval(() => {
    if (useStore.getState().isPaused) return;
    const layers: LayerType[] = ['network', 'endpoint', 'application'];
    const layer = layers[Math.floor(Math.random() * layers.length)];
    const ts = new Date().toISOString();
    
    useStore.getState().addRawLog({
      layer,
      raw: `${ts.replace('T', ' ').substring(0, 19)} | ${generateRandomIP()} -> 10.0.0.1 | PORT:22 | PROTO:TCP | BYTES:1240 | FLAGS:SYN`,
      normalized: {
        timestamp: ts,
        src_ip: generateRandomIP(),
        dst_ip: '10.0.0.1',
        port: 22,
        protocol: 'TCP',
        bytes: 1240,
        flags: 'SYN',
        event_type: 'connection_attempt',
        schema_version: '2.1'
      }
    });
  }, 500); 
};
