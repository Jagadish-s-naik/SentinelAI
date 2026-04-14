import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { startSimulationEngine } from './lib/SimulationEngine';
import Layout from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { Detection } from './pages/Detection';
import { Correlation } from './pages/Correlation';
import { Playbooks } from './pages/Playbooks';
import { MitreMap } from './pages/MitreMap';
import { Settings } from './pages/Settings';

import { useStore } from './store';

function App() {
  const initialize = useStore(state => state.initialize);

  useEffect(() => {
    // Initialize the Supabase store
    initialize();
    
    // Start generating simulated security events on mount
    startSimulationEngine();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="detection" element={<Detection />} />
          <Route path="correlation" element={<Correlation />} />
          <Route path="playbooks" element={<Playbooks />} />
          <Route path="mitre" element={<MitreMap />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
