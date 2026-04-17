import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  ScanSearch,
  GitMerge,
  BookOpen,
  Map as MapIcon,
  Settings as SettingsIcon,
  Bell,
  Search,
  Pause,
  Play,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Cpu,
  Radio,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Toast System ─────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: string; type: ToastType; title: string; desc?: string; }

let _showToast: ((t: Omit<Toast, 'id'>) => void) | null = null;
export function showToast(t: Omit<Toast, 'id'>) { _showToast?.(t); }

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  _showToast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { ...t, id }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000);
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error:   <ShieldAlert className="w-4 h-4 text-red-accent" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning" />,
    info:    <Info className="w-4 h-4 text-info" />,
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`toast ${t.type}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
              <div>
                <div className="toast-title">{t.title}</div>
                {t.desc && <div className="toast-desc">{t.desc}</div>}
              </div>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="ml-auto shrink-0 text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Nav Items ────────────────────────────────────────────────────────────────
const navItems = [
  { name: 'Dashboard',        path: '/dashboard',   icon: LayoutDashboard },
  { name: 'Incidents',        path: '/incidents',   icon: ShieldAlert },
  { name: 'Detection Engine', path: '/detection',   icon: ScanSearch },
  { name: 'Correlation',      path: '/correlation', icon: GitMerge },
  { name: 'Playbooks',        path: '/playbooks',   icon: BookOpen },
  { name: 'MITRE Map',        path: '/mitre',       icon: MapIcon },
  { name: 'Settings',         path: '/settings',    icon: SettingsIcon },
];

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = () => {
  const { incidents, isPaused, pauseSimulation, searchResults, setSearchQuery: setStoreQ, backendStats } = useStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cpuLoad, setCpuLoad] = useState(42);
  const [ingress, setIngress] = useState(1.5);
  const [latency, setLatency] = useState(25);
  const [activeNodes] = useState(12);

  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;

  useEffect(() => {
    const t1 = setInterval(() => setCurrentTime(new Date()), 1000);
    const t2 = setInterval(() => {
      setCpuLoad(Math.floor(Math.random() * 20 + 30));
      setIngress(+(Math.random() * 2 + 1).toFixed(2));
      setLatency(+(Math.random() * 10 + 20).toFixed(0));
    }, 3000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setStoreQ(q);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="flex flex-col justify-between transition-all duration-300 sidebar-scroll overflow-y-auto"
        style={{
          background: '#0D0D0D',
          width: sidebarExpanded ? '200px' : '56px',
          minWidth: sidebarExpanded ? '200px' : '56px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div>
          <div
            className="flex items-center gap-3 px-4 cursor-pointer border-b"
            style={{ height: '56px', borderColor: '#1A1A1A' }}
            onClick={() => setSidebarExpanded(p => !p)}
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: '#E53935' }}>
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            {sidebarExpanded && (
              <span className="text-white font-bold text-sm tracking-wider whitespace-nowrap">SENTINEL AI</span>
            )}
          </div>

          {/* Nav */}
          <nav className="py-3">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                title={!sidebarExpanded ? item.name : undefined}
                className={({ isActive }) =>
                  `nav-item flex items-center gap-3 px-4 py-2.5 cursor-pointer ${isActive ? 'nav-active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? '#E53935' : '#9CA3AF' }}
                    />
                    {sidebarExpanded && (
                      <span
                        className="text-sm font-medium whitespace-nowrap"
                        style={{ color: isActive ? '#E53935' : '#D1D5DB' }}
                      >
                        {item.name}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t" style={{ borderColor: '#1A1A1A' }}>
          {sidebarExpanded ? (
            <div className="text-xs font-mono" style={{ color: '#4B5563' }}>
              <div>v2.0.0 · Pipeline {backendStats ? '🟢' : '🔴'}</div>
              <div>{backendStats?.eps?.toFixed(1) ?? '0.0'} eps</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className={`w-2 h-2 rounded-full ${backendStats ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header
          className="flex items-center gap-4 px-6 shrink-0 border-b"
          style={{ height: '56px', background: '#FFFFFF', borderColor: '#E5E7EB', zIndex: 50 }}
        >
          {/* Search */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search incidents, IPs, techniques..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-colors"
                style={{
                  background: '#F9FAFB',
                  border: isSearchFocused ? '1px solid #E53935' : '1px solid #E5E7EB',
                  color: '#111827',
                  fontFamily: 'Inter, sans-serif',
                }}
              />

              {/* Search Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-panel overflow-hidden z-50"
                    style={{ background: '#fff', borderColor: '#E5E7EB' }}
                  >
                    {searchResults.incidents.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          Incidents ({searchResults.incidents.length})
                        </div>
                        {searchResults.incidents.slice(0, 4).map(inc => (
                          <button
                            key={inc.id}
                            onClick={() => navigate(`/incidents?id=${inc.id}`)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-3"
                          >
                            <span className="badge-critical text-xs px-1.5 py-0.5 rounded font-mono">{inc.severity}</span>
                            <span className="font-medium" style={{ color: '#111827' }}>{inc.type.replace('_', ' ')}</span>
                            <span className="ml-auto text-xs font-mono" style={{ color: '#9CA3AF' }}>{inc.src_ip}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.techniques.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          MITRE Techniques
                        </div>
                        {searchResults.techniques.slice(0, 3).map(t => (
                          <button
                            key={t.id}
                            onClick={() => navigate('/mitre')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: '#FFF1F0', color: '#E53935' }}>{t.id}</span>
                            <span style={{ color: '#6B7280' }}>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.incidents.length === 0 && searchResults.techniques.length === 0 && (
                      <div className="px-4 py-3 text-sm" style={{ color: '#9CA3AF' }}>No results found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* SIM MODE */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ background: '#FFF1F0', borderColor: '#FECACA', color: '#E53935' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-pulse" />
              SIM MODE
            </div>

            {/* Clock */}
            <div className="font-mono text-xs" style={{ color: '#6B7280' }}>
              {format(currentTime, 'HH:mm:ss')}
            </div>

            {/* Pause / Resume */}
            <button
              onClick={() => pauseSimulation(!isPaused)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={{
                background: isPaused ? '#FFF1F0' : '#F9FAFB',
                borderColor: isPaused ? '#FECACA' : '#E5E7EB',
                color: isPaused ? '#E53935' : '#6B7280',
              }}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'RESUME' : 'PAUSE FEED'}
            </button>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(p => !p)}
                className="relative w-8 h-8 rounded-full flex items-center justify-center border transition-colors hover:bg-gray-50"
                style={{ borderColor: '#E5E7EB' }}
              >
                <Bell className="w-4 h-4" style={{ color: '#6B7280' }} />
                {criticalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: '#E53935' }}>
                    {criticalCount > 9 ? '9+' : criticalCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-panel overflow-hidden z-50"
                    style={{ background: '#fff', borderColor: '#E5E7EB' }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4" style={{ color: '#E53935' }} />
                        <span className="font-semibold text-sm" style={{ color: '#111827' }}>Direct Intelligence Feed</span>
                      </div>
                      <button onClick={() => setShowNotifications(false)} style={{ color: '#9CA3AF' }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {incidents.slice(0, 8).map(inc => (
                        <button
                          key={inc.id}
                          onClick={() => { navigate(`/incidents?id=${inc.id}`); setShowNotifications(false); }}
                          className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors"
                          style={{ borderColor: '#F3F4F6' }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              inc.severity === 'CRITICAL' ? 'badge-critical' :
                              inc.severity === 'HIGH' ? 'badge-high' :
                              inc.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                            }`}>{inc.severity}</span>
                            <span className="text-xs font-medium" style={{ color: '#111827' }}>{inc.type.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="text-xs font-mono" style={{ color: '#9CA3AF' }}>{inc.src_ip} → {inc.target}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono px-1 rounded" style={{ background: '#FFF7ED', color: '#EA580C' }}>{inc.mitre_tag}</span>
                            <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{inc.confidence}% confidence</span>
                          </div>
                        </button>
                      ))}
                      {incidents.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm" style={{ color: '#9CA3AF' }}>No active intelligence signals</div>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                      <button onClick={() => { navigate('/incidents'); setShowNotifications(false); }} className="text-xs font-semibold" style={{ color: '#E53935' }}>
                        View all incidents →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#E53935' }}>
              SA
            </div>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#FFFFFF' }}>
          <div className="page-enter h-full">
            <Outlet />
          </div>
        </main>

        {/* ── Status Bar ──────────────────────────────────────── */}
        <footer
          className="status-bar flex items-center justify-between px-6 shrink-0 border-t"
          style={{ height: '36px', background: '#FFFFFF', borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" style={{ color: '#9CA3AF' }} />
              <span className="mono-data" style={{ color: '#6B7280' }}>CPU: {cpuLoad}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="mono-data" style={{ color: '#6B7280' }}>Ingress: {ingress} MB/s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E53935' }} />
              <span className="mono-data" style={{ color: '#E53935' }}>{backendStats ? 'PIPELINE ACTIVE' : 'OFFLINE'}</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="mono-data" style={{ color: '#6B7280' }}>Active Nodes: {activeNodes}</span>
            <span className="mono-data" style={{ color: '#6B7280' }}>Latency: {latency}ms</span>
            <span className="mono-data" style={{ color: '#9CA3AF' }}>EPS: {backendStats?.eps?.toFixed(2) ?? '—'}</span>
          </div>
        </footer>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Layout;
