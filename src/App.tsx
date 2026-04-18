import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { Detection } from './pages/Detection';
import { Correlation } from './pages/Correlation';
import { Playbooks } from './pages/Playbooks';
import { MitreMap } from './pages/MitreMap';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';

import { useStore } from './store';

function App() {
  const initialize = useStore(state => state.initialize);

  useEffect(() => {
    // Initialize the Supabase store
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
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
