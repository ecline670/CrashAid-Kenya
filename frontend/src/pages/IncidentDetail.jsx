import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useStore } from '../store';
import { Pill, ago, label, mapUrl } from '../ui';

const NEXT = ['en_route', 'on_scene', 'resolved', 'cancelled'];

export default function IncidentDetail() {
  const { id } = useParams();
  const [inc, setInc] = useState(null);
  const [err, setErr] = useState('');
  const live = useStore((s) => s.incidents.find((x) => x.id === Number(id)));
  const fetchIt = () => api.get(`/incidents/${id}`).then((r) => setInc(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { fetchIt(); }, [id, live?.status, live?.callsign]);

  const setStatus = async (status) => {
    if (status === 'cancelled' && !confirm('Cancel this incident?')) return;
    try { await api.patch(`/incidents/${id}/status`, { status }); } catch (e) { setErr(errMsg(e)); }
  };
  if (err) return <p className="err">{err}</p>;
  if (!inc) return <p>Loading…</p>;
  const closed = ['resolved', 'cancelled'].includes(inc.status);
  return (
    <>
      <Link to="/incidents" className="back">Back to incidents</Link>
      <h2>Incident #{inc.id} <Pill v={inc.severity} /> <Pill v={inc.status} /></h2>
      <div className="card">
        <p>{inc.description || 'No description given.'}</p>
        <dl>
          <dt>Reported</dt><dd>{ago(inc.created_at)}{inc.reporter ? ` by ${inc.reporter}` : ''}</dd>
          <dt>Phone</dt><dd>{inc.phone ? <a href={`tel:${inc.phone}`}>{inc.phone}</a> : 'Not provided'}</dd>
          <dt>Location</dt><dd><a href={mapUrl(inc)} target="_blank" rel="noreferrer">{inc.lat.toFixed(5)}, {inc.lng.toFixed(5)}</a></dd>
          <dt>Unit</dt><dd>{inc.callsign || 'Waiting for the nearest available ambulance'}</dd>
        </dl>
        {!closed && (
          <div className="actions">
            {NEXT.filter((s) => s !== inc.status).map((s) => (
              <button key={s} className={`btn ${s === 'cancelled' ? 'ghost' : ''}`} onClick={() => setStatus(s)}>Mark {label(s)}</button>
            ))}
          </div>
        )}
      </div>
      <h3>Timeline</h3>
      <ul className="timeline">{inc.events.map((e, k) => <li key={k}><b>{e.note}</b><small>{new Date(e.created_at).toLocaleTimeString()}</small></li>)}</ul>
    </>
  );
}
