import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ORIGIN } from '../api';

export default function Settings() {
  const { user, logout } = useStore();
  const nav = useNavigate();
  return (
    <>
      <h2>Settings</h2>
      <div className="card">
        <dl>
          <dt>Signed in as</dt><dd>{user.name} ({user.email})</dd>
          <dt>Role</dt><dd>{user.role}</dd>
          <dt>API</dt><dd>{ORIGIN || 'Same origin (dev proxy)'}</dd>
        </dl>
        <button className="btn" onClick={async () => { await logout(); nav('/login'); }}>Sign out</button>
      </div>
    </>
  );
}
