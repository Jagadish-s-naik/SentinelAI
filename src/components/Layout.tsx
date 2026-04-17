import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  Layers, 
  Map as MapIcon, 
  Settings as SettingsIcon,
  Bell,
  SearchIcon,
  Cpu,
  Network,
  ActivitySquare,
  Clock,
  Play,
  Pause,
  ChevronRight,
  Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const Layout = () => {
  const { incidents, isPaused, pauseSimulation, searchResults, setSearchQuery: setStoreSearchQuery } = useStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  
  const [currentTime, setCurrentTime] = useState(new Date());

  const [cpuLoad, setCpuLoad] = useState(42);
  const [ingress, setIngress] = useState(1.5);
  const [latency, setLatency] = useState(25);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const statsTimer = setInterval(() => {
      setCpuLoad(Math.floor(Math.random() * 20 + 30));
      setIngress(Number((Math.random() * 2 + 1).toFixed(2)));
      setLatency(Number((Math.random() * 10 + 20).toFixed(0)));
    }, 3000);
    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { name: 'Detection Engine', path: '/detection', icon: Search },
    { name: 'Correlation', path: '/correlation', icon: Layers },
    { name: 'Playbooks', path: '/playbooks', icon: ActivitySquare },
    { name: 'MITRE Map', path: '/mitre', icon: MapIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border-subtle flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border-subtle">
            <ShieldAlert className="w-6 h-6 text-teal-accent mr-3" />
            <span className="font-heading font-bold tracking-wider text-teal-accent text-lg">SENTINEL AI</span>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                    isActive 
                      ? 'bg-secondary-card text-teal-accent border-l-2 border-teal-accent' 
                      : 'text-text-muted hover:bg-secondary-card hover:text-text-primary'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border-subtle flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center w-96 relative group">
            <SearchIcon className="w-4 h-4 text-text-muted absolute left-3 z-10" />
            <input 
              type="text" 
              placeholder="Query threat database..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setStoreSearchQuery(e.target.value);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-secondary-card text-sm text-text-primary placeholder-text-muted rounded-md pl-10 pr-4 py-2 border border-transparent focus:border-teal-accent focus:outline-none transition-colors relative z-10"
            />
            
            {/* Spotlight Search Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsSearchFocused(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-full bg-card border border-border-subtle rounded-lg shadow-2xl z-30 overflow-hidden max-h-[400px] flex flex-col"
                  >
                    <div className="p-3 bg-secondary-card/50 border-b border-border-subtle text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Intelligence Insights
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar">
                        {/* Incidents Section */}
                        {searchResults.incidents.length > 0 && (
                            <div className="p-2">
                                <span className="px-2 py-1 text-[9px] font-bold text-teal-accent/70 uppercase">Correlated Events</span>
                                {searchResults.incidents.map(inc => (
                                    <button 
                                        key={inc.id}
                                        onClick={() => {
                                            navigate(`/incidents?id=${inc.id}`);
                                            setIsSearchFocused(false);
                                            setSearchQuery('');
                                        }}
                                        className="w-full text-left p-2 hover:bg-teal-accent/10 rounded group transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white group-hover:text-teal-accent">{inc.type.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-text-muted font-mono">{inc.src_ip} • {inc.severity}</span>
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-text-muted" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Techniques Section */}
                        {searchResults.techniques.length > 0 && (
                            <div className="p-2 border-t border-border-subtle/50">
                                <span className="px-2 py-1 text-[9px] font-bold text-orange-warning/70 uppercase">MITRE Techniques</span>
                                {searchResults.techniques.map(tech => (
                                    <button 
                                        key={tech.id}
                                        onClick={() => {
                                            navigate(`/mitre?id=${tech.id}`);
                                            setIsSearchFocused(false);
                                            setSearchQuery('');
                                        }}
                                        className="w-full text-left p-2 hover:bg-orange-warning/10 rounded group transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white group-hover:text-orange-warning">{tech.name}</span>
                                            <span className="text-[10px] text-text-muted font-mono">{tech.id}</span>
                                        </div>
                                        <div className="p-1 bg-secondary-card rounded border border-border-subtle group-hover:border-orange-warning/50">
                                            <MapIcon className="w-3 h-3 text-text-muted group-hover:text-orange-warning" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchResults.incidents.length === 0 && searchResults.techniques.length === 0 && (
                            <div className="p-8 text-center text-text-muted">
                                <Info className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                <p className="text-xs font-mono">No matching telemetry found in local index.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 bg-secondary-card border-t border-border-subtle text-center">
                        <span className="text-[9px] text-text-muted uppercase tracking-tighter">Press <kbd className="bg-background border px-1.5 rounded">Enter</kbd> for deep database query</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="flex items-center text-xs font-mono text-orange-warning border border-orange-warning px-2 py-1 rounded bg-orange-warning/10 hover:bg-orange-warning/20 transition-colors">
              SIM MODE
            </button>

            <div className="flex items-center text-sm font-mono text-text-muted">
              <Clock className="w-4 h-4 mr-2" />
              {currentTime.toUTCString().replace('GMT', 'UTC')}
            </div>

            <button 
              onClick={() => pauseSimulation(!isPaused)}
              className={`flex items-center text-[10px] font-mono px-3 py-1 rounded border transition-all ${
                isPaused 
                  ? 'bg-teal-accent/20 text-teal-accent border-teal-accent hover:bg-teal-accent/30' 
                  : 'bg-orange-warning/10 text-orange-warning border-orange-warning/50 hover:bg-orange-warning/20'
              }`}
            >
              {isPaused ? <Play className="w-3 h-3 mr-1.5" /> : <Pause className="w-3 h-3 mr-1.5" />}
              {isPaused ? 'RESUME FEED' : 'PAUSE FEED'}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative transition-colors ${showNotifications ? 'text-teal-accent' : 'text-text-muted hover:text-text-primary'}`}
              >
                <Bell className="w-5 h-5" />
                {criticalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-alert rounded-full animate-pulse-slow shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-96 bg-card border border-border-subtle rounded-lg shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-secondary-card/50">
                        <h3 className="text-xs font-heading font-bold uppercase tracking-widest text-text-muted">Direct Intelligence Feed</h3>
                        <span className="text-[10px] font-mono text-teal-accent bg-teal-accent/10 px-2 py-0.5 rounded">
                          {incidents.length} TOTAL_EVENTS
                        </span>
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {incidents.length === 0 ? (
                          <div className="p-8 text-center">
                            <Info className="w-8 h-8 text-text-muted opacity-20 mx-auto mb-3" />
                            <p className="text-xs text-text-muted font-mono tracking-tight">No critical activity detected in current session.</p>
                          </div>
                        ) : (
                          incidents.slice(0, 5).map((incident) => (
                            <button
                              key={incident.id}
                              onClick={() => {
                                navigate(`/incidents?id=${incident.id}`);
                                setShowNotifications(false);
                              }}
                              className="w-full text-left p-4 hover:bg-secondary-card/50 border-b border-white/5 transition-colors group"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-bold font-mono ${
                                  incident.severity === 'CRITICAL' ? 'text-red-alert' : 
                                  incident.severity === 'HIGH' ? 'text-orange-warning' : 'text-blue-accent'
                                }`}>
                                  {incident.severity}
                                </span>
                                <span className="text-[9px] text-text-muted font-mono">
                                  {format(new Date(incident.timestamp), 'HH:mm:ss')}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-white group-hover:text-teal-accent transition-colors line-clamp-1 uppercase">{incident.type.replace('_', ' ')}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[9px] text-text-muted uppercase tracking-wider">{incident.type}</span>
                                <ChevronRight className="w-3 h-3 text-text-muted group-hover:text-teal-accent transform group-hover:translate-x-1 transition-all" />
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      
                      <button 
                        onClick={() => {
                          navigate('/incidents');
                          setShowNotifications(false);
                        }}
                        className="w-full p-3 bg-secondary-card text-[10px] font-bold uppercase tracking-tighter text-teal-accent border-t border-border-subtle hover:bg-teal-accent/10 transition-colors"
                      >
                        Launch Incident Response Workbench
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="w-8 h-8 rounded border border-teal-accent/30 bg-secondary-card flex items-center justify-center overflow-hidden">
              <span className="text-teal-accent text-xs font-bold">A1</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <Outlet />
        </main>

        {/* Footer Status Bar */}
        <footer className="h-10 bg-card border-t border-border-subtle flex items-center justify-between px-6 text-xs text-text-muted font-mono shrink-0">
          <div className="flex space-x-6">
            <div className="flex items-center"><Cpu className="w-3 h-3 mr-2" /> CPU Load: {cpuLoad}%</div>
            <div className="flex items-center"><Network className="w-3 h-3 mr-2" /> Ingress: {ingress} GB/s</div>
          </div>
          <div className="flex space-x-6">
            <div>Active Nodes: 1,024</div>
            <div className="flex items-center">Latency: <span className="text-teal-accent ml-2">{latency}ms</span></div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
