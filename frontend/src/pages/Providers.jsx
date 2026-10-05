import { useEffect, useState } from 'react';
import api from '../api';

const TITLES = { ambulance: 'Ambulance services', hospital: 'Hospitals', police: 'Police', insurer: 'Insurers', lawyer: 'Lawyers', mechanic: 'Mechanics and towing' };

export default function Providers() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get('/providers').then((r) => setList(r.data)); }, []);
  return (
    <>
      <h2>Providers</h2>
      {Object.keys(TITLES).map((t) => {
        const items = list.filter((p) => p.type === t);
        return items.length ? (
          <section key={t}>
            <h3>{TITLES[t]}</h3>
            <div className="list">
              {items.map((p) => (
                <div key={p.id} className="row"><b>{p.name}</b>{p.phone && <a href={`tel:${p.phone.replace(/\s/g, '')}`}>{p.phone}</a>}</div>
              ))}
            </div>
          </section>
        ) : null;
      })}
    </>
  );
}
