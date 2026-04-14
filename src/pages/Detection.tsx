import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Search, ArrowRight, Server, Terminal, Braces } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useStore } from '../store';
import { format } from 'date-fns';

const ModelStatusCard = ({ name, accuracy, date }: { name: string, accuracy: number, date: string }) => (
  <div className="bg-card border border-border-subtle rounded-lg p-5 flex flex-col shadow-lg">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-heading font-semibold text-white text-lg">{name}</h3>
      <span className="bg-teal-accent/20 text-teal-accent text-xs px-2 py-1 rounded font-bold flex items-center">
        <CheckCircle2 className="w-3 h-3 mr-1" /> ACTIVE
      </span>
    </div>
    <div className="flex justify-between items-end mt-auto">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Accuracy</p>
        <p className="font-mono text-2xl font-bold text-teal-accent">{accuracy}%</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Last Trained</p>
        <p className="font-mono text-xs">{date}</p>
      </div>
    </div>
  </div>
);

const ThreatSparkline = ({ title, count, data, color }: { title: string, count: number, data: { value: number }[], color: string }) => (
  <div className="bg-secondary-card rounded-lg p-4 flex items-center justify-between shadow-lg">
    <div className="w-1/2">
      <p className="text-xs text-text-muted font-heading uppercase mb-1">{title}</p>
      <p className="font-mono text-2xl font-bold text-white">{count}</p>
    </div>
    <div className="w-1/2 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const Detection = () => {
  const { rawLogs, incidents } = useStore();
  const [activeTab, setActiveTab] = useState<'network' | 'endpoint' | 'application'>('network');

  const filteredLogs = useMemo(() => rawLogs.filter(l => l.layer === activeTab).slice(0, 15), [rawLogs, activeTab]);
  const normalizedLogs = useMemo(() => filteredLogs.slice().reverse(), [filteredLogs]);

  // Generate some fake historical data for the sparklines based on current counts
  const generateSparkData = (baseCount: number) => {
    return Array.from({length: 20}).map((_, i) => ({ value: Math.max(0, baseCount + Math.floor(Math.random() * 10 - 5)) + i }));
  };

  const getIncCount = (type: string) => incidents.filter(i => i.type === type).length;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <h1 className="text-2xl font-heading font-bold text-white flex items-center">
        <Search className="mr-3 text-teal-accent" /> AI Detection Engine
      </h1>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModelStatusCard name="Isolation Forest" accuracy={94.2} date={format(new Date(), "yyyy-MM-dd 02:00")} />
        <ModelStatusCard name="XGBoost Classifier" accuracy={96.8} date={format(new Date(), "yyyy-MM-dd 03:30")} />
        <ModelStatusCard name="LSTM Time-Series" accuracy={91.5} date={format(new Date(), "yyyy-MM-dd 01:15")} />
      </div>

      {/* Threat Categories Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ThreatSparkline title="Brute Force" count={getIncCount('brute_force')} data={generateSparkData(getIncCount('brute_force') || 5)} color="#FF4C4C" />
        <ThreatSparkline title="Lateral Movement" count={getIncCount('lateral_movement')} data={generateSparkData(getIncCount('lateral_movement') || 3)} color="#FF8C42" />
        <ThreatSparkline title="Data Exfiltration" count={getIncCount('exfiltration')} data={generateSparkData(getIncCount('exfiltration') || 2)} color="#1E90FF" />
        <ThreatSparkline title="C2 Beaconing" count={getIncCount('c2_beacon')} data={generateSparkData(getIncCount('c2_beacon') || 8)} color="#7B5EA7" />
      </div>

      {/* Real-time Log Ingestion */}
      <div className="border border-border-subtle rounded-lg bg-card shadow-lg flex-1 flex flex-col min-h-[400px]">
        <div className="flex border-b border-border-subtle bg-secondary-card p-2">
          {['network', 'endpoint', 'application'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'network' | 'endpoint' | 'application')}
              className={`px-6 py-2 text-xs font-mono font-bold uppercase transition-colors rounded ${
                activeTab === tab 
                  ? 'bg-teal-accent/20 text-teal-accent' 
                  : 'text-text-muted hover:text-white hover:bg-background/50'
              }`}
            >
              <Server className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              {tab} Layer
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* Divider */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center justify-center p-3 rounded-full bg-card border border-border-subtle shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <ArrowRight className="w-6 h-6 text-teal-accent animate-pulse" />
          </div>

          {/* Left Side: RAW LOG */}
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-border-subtle bg-black p-4 font-mono text-sm overflow-hidden relative group">
            <h4 className="absolute top-4 right-4 text-[#006400] text-xs uppercase flex items-center pointer-events-none">
              <Terminal className="w-4 h-4 mr-1" /> RAW INPUT
            </h4>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
            <div className="h-full flex flex-col justify-end text-[#00ff00] opacity-80 overflow-y-hidden">
              {normalizedLogs.map((log) => (
                <motion.div 
                  key={"raw-"+log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-1 break-all"
                >
                  {log.raw}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side: NORMALIZED */}
          <div className="flex-1 bg-card p-4 font-mono overflow-y-auto relative text-sm pb-10">
            <h4 className="absolute top-4 right-4 text-teal-accent text-xs uppercase flex items-center pointer-events-none bg-card/80 p-1 rounded z-10">
              <Braces className="w-4 h-4 mr-1" /> NORMALIZED
            </h4>
            {filteredLogs.map(log => (
              <motion.div 
                key={"norm-"+log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-secondary-card p-3 rounded border border-border-subtle relative"
              >
                <span className="absolute top-2 right-2 text-[10px] text-teal-accent border border-teal-accent/30 px-1 rounded bg-teal-accent/10">NORMALIZED ✓</span>
                <pre className="text-white text-xs">
                  <span className="text-[#8CA0C8]">{"{"}</span>
                  {Object.entries(log.normalized).map(([key, value], i) => (
                    <div key={key} className="pl-4">
                      <span className="text-blue-accent">"{key}"</span>: <span className={typeof value === 'string' ? "text-[#f1fa8c]" : "text-[#bd93f9]"}>{typeof value === 'string' ? `"${value}"` : value}</span>{i < Object.keys(log.normalized).length -1 ? ',' : ''}
                    </div>
                  ))}
                  <span className="text-[#8CA0C8]">{"}"}</span>
                </pre>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
