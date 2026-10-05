import { useStore } from '../store';
import { IncidentRow } from '../ui';

export default function Dashboard() {
  const { incidents, units } = useStore();
  const active = incidents.filter((i) => !['resolved', 'cancelled'].includes(i.status));
  const today = new Date().toDateString();
  const stats = [
    ['Active incidents', active.length],
    ['Waiting for a unit', incidents.filter((i) => i.status === 'new').length, 'warn'],
    ['Units available', `${units.filter((u) => u.status === 'available').length}/${units.length}`],
    ['Resolved today', incidents.filter((i) => i.status === 'resolved' && new Date(i.updated_at).toDateString() === today).length],
  ];
  return (
    <>
      <h2>Dashboard</h2>
      <section className="stats">
        {stats.map(([k, v, c]) => <div key={k} className={`stat ${c || ''}`}><strong>{v}</strong><span>{k}</span></div>)}
      </section>
      <h3>Active incidents</h3>
      <div className="list">
        {active.length ? active.map((i) => <IncidentRow key={i.id} i={i} />) : <p className="empty">No active incidents.</p>}
      </div>
    </>
  );
}
