import { Outlet, NavLink } from 'react-router-dom';
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
  Pause
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '../store';

const Layout = () => {
  const { incidents, isPaused, pauseSimulation } = useStore();
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
          <div className="flex items-center w-96 relative">
            <SearchIcon className="w-4 h-4 text-text-muted absolute left-3" />
            <input 
              type="text" 
              placeholder="Query threat database..." 
              className="w-full bg-secondary-card text-sm text-text-primary placeholder-text-muted rounded-md pl-10 pr-4 py-2 border border-transparent focus:border-teal-accent focus:outline-none transition-colors"
            />
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

            <button className="relative text-text-muted hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-alert rounded-full animate-pulse-slow"></span>
              )}
            </button>
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
