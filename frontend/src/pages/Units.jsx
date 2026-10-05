import { useStore } from '../store';
import { Pill, ago } from '../ui';

export default function Units() {
  const units = useStore((s) => s.units);
  return (
    <>
      <h2>Units</h2>
      <div className="list">
        {units.map((u) => (
          <div key={u.id} className="row">
            <div><b>{u.callsign}</b><small>{u.provider} · updated {ago(u.updated_at)}</small></div>
            <div className="pills">
              {u.lat != null && <a href={`https://www.google.com/maps?q=${u.lat},${u.lng}`} target="_blank" rel="noreferrer">Map</a>}
              <Pill v={u.status} />
            </div>
          </div>
        ))}
        {!units.length && <p className="empty">No units registered.</p>}
      </div>
    </>
  );
}
