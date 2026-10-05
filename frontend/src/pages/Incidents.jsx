import { useState } from 'react';
import { useStore } from '../store';
import { IncidentRow, label } from '../ui';

const FILTERS = ['all', 'new', 'dispatched', 'en_route', 'on_scene', 'resolved', 'cancelled'];

export default function Incidents() {
  const incidents = useStore((s) => s.incidents);
  const [f, setF] = useState('all');
  const shown = f === 'all' ? incidents : incidents.filter((i) => i.status === f);
  return (
    <>
      <h2>Incidents</h2>
      <div className="tabs">
        {FILTERS.map((x) => <button key={x} className={f === x ? 'on' : ''} onClick={() => setF(x)}>{label(x)}</button>)}
      </div>
      <div className="list">
        {shown.length ? shown.map((i) => <IncidentRow key={i.id} i={i} />) : <p className="empty">Nothing here.</p>}
      </div>
    </>
  );
}
