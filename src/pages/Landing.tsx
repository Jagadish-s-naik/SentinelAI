import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Search, Activity, ChevronRight, Lock, Globe, Server } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-red-600" />,
      title: "AI-Driven Ingestion",
      desc: "Real-time telemetry analysis using Isolation Forest and XGBoost models to identify anomalies before they become incidents."
    },
    {
      icon: <Search className="w-6 h-6 text-red-600" />,
      title: "Forensic Graphing",
      desc: "Automated relationship mapping and Blast Radius computation to visualize path-of-travel and entity compromise."
    },
    {
      icon: <Zap className="w-6 h-6 text-red-600" />,
      title: "Dynamic Playbooks",
      desc: "LLM-powered incident response strategies generated in real-time, tailored to the specific MITRE technique detected."
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-red-100 selection:text-red-700 font-inter">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 italic">SENTINEL<span className="text-red-600 not-italic">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-red-600 transition-colors">Forensics</a>
            <a href="#mitre" className="hover:text-red-600 transition-colors">MITRE Matrix</a>
            <a href="#ai" className="hover:text-red-600 transition-colors">AI Engine</a>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Launch Command Center
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ 
          backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold tracking-widest uppercase mb-8">
              <Activity className="w-3 h-3 animate-pulse" />
              Next-Gen SOC Workbench
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9] mb-8">
              PREDICT.<br />
              DETECT.<br />
              <span className="text-red-600">NEUTRALIZE.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 font-medium mb-12">
              The world's first AI-native forensic workbench designed for modern SOC teams. 
              Accelerate incident resolution from hours to seconds with automated artifact correlation.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 group"
              >
                Launch Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold text-lg hover:border-gray-900 transition-all">
                View Documentation
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker Section */}
      <div className="bg-gray-900 py-3 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-inner flex gap-12 text-[10px] font-mono font-medium text-gray-400 uppercase tracking-[0.2em]">
            <span>[ SYSTEM STATUS: OPERATIONAL ]</span>
            <span>[ INGESTION RATE: 42.5K EPS ]</span>
            <span>[ ACTIVE THREATS MITIGATED: 1,204 ]</span>
            <span>[ MITRE COVERAGE: 86.4% ]</span>
            <span>[ AI CONFIDENCE: 99.2% ]</span>
            <span>[ SYSTEM STATUS: OPERATIONAL ]</span>
            <span>[ INGESTION RATE: 42.5K EPS ]</span>
            <span>[ ACTIVE THREATS MITIGATED: 1,204 ]</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#FAFAFA] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white border border-gray-200 rounded-2xl hover:border-red-600/30 transition-all group"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Proof */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-left">
              <h2 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                Forensic Analysis at the <br />
                <span className="text-red-600">Speed of Thought.</span>
              </h2>
              <p className="text-gray-600 mb-8 max-w-lg">
                Stop chasing false positives. SentinelAI automatically correlates disparate logs into single, actionable forensic stories.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-black text-gray-900 tracking-tighter">94%</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-nowrap">Reduction in TTR</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-gray-900 tracking-tighter">0.1ms</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-nowrap">Detection Latency</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-xl">
              {/* Mockup Frame */}
              <div className="p-1 bg-gray-200 rounded-2xl shadow-2xl">
                <div className="bg-white rounded-xl overflow-hidden aspect-video border border-gray-100 flex items-center justify-center relative dot-grid">
                   <div className="absolute inset-x-0 top-0 h-6 bg-gray-50 border-b border-gray-100 flex items-center px-3 gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-red-400"></div>
                     <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                     <div className="w-2 h-2 rounded-full bg-green-400"></div>
                   </div>
                   <div className="p-8 text-center">
                      <Lock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <div className="h-2 w-32 bg-gray-100 rounded-full mx-auto mb-2"></div>
                      <div className="h-2 w-24 bg-gray-50 rounded-full mx-auto"></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-gray-900 italic">SENTINEL<span className="text-red-600 not-italic">AI</span></span>
          </div>
          <p className="text-gray-400 text-xs">
            © 2026 SentinelAI Forensic Command Center. All security assets protected.
          </p>
          <div className="flex items-center gap-6 text-gray-400">
            <Globe className="w-5 h-5 hover:text-gray-900 cursor-pointer" />
            <Lock className="w-5 h-5 hover:text-gray-900 cursor-pointer" />
            <Server className="w-5 h-5 hover:text-gray-900 cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
};
