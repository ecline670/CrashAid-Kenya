import { useState } from 'react';
import { useStore } from '../store';
import { IncidentRow, label } from '../ui';

const FILTERS = ['all', 'new', 'dispatched', 'en_route', 'on_scene', 'resolved', 'cancelled'];

export default function Incidents() {
  const incidents = useStore((s) => s.incidents);
  const [f, setF] = useState('all');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const shown = incidents.filter((i) => {
    const matchesStatus = f === 'all' || i.status === f;
    const searchable = [i.id, i.description, i.reporter, i.phone, i.callsign]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  return (
    <>
      <h2>Incidents</h2>
      <label className="search-label">
        <span>Search incidents</span>
        <input
          type="search"
          placeholder="ID, reporter, phone, unit, or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="tabs">
        {FILTERS.map((x) => <button key={x} className={f === x ? 'on' : ''} onClick={() => setF(x)}>{label(x)}</button>)}
      </div>
      <div className="list">
        {shown.length ? shown.map((i) => <IncidentRow key={i.id} i={i} />) : <p className="empty">Nothing here.</p>}
      </div>
    </>
  );
}
