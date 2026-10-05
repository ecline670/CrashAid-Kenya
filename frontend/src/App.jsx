import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { IconLayoutDashboard, IconAlertTriangle, IconAmbulance, IconBuildingHospital, IconSettings } from '@tabler/icons-react';
import { useStore } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import Units from './pages/Units';
import Providers from './pages/Providers';
import Settings from './pages/Settings';

const nav = [
  ['/', 'Dashboard', IconLayoutDashboard], ['/incidents', 'Incidents', IconAlertTriangle],
  ['/units', 'Units', IconAmbulance], ['/providers', 'Providers', IconBuildingHospital], ['/settings', 'Settings', IconSettings],
];

function Shell() {
  const { user, live, load, connect } = useStore();
  useEffect(() => { if (user) { load(); connect(); } }, [user]);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="shell">
      <aside>
        <div className="brand"><b>Acci</b><span>Res</span><small>CrashAid Kenya</small></div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'}><Icon size={20} />{label}</NavLink>
          ))}
        </nav>
        <div className={`live ${live ? 'on' : ''}`}>{live ? 'Live' : 'Reconnecting'}</div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="units" element={<Units />} />
        <Route path="providers" element={<Providers />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
