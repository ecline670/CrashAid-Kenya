import { Link } from 'react-router-dom';

export const label = (s) => s.replace('_', ' ');
export const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(d).toLocaleDateString();
};
export const Pill = ({ v }) => <span className={`pill ${v}`}>{label(v)}</span>;
export const mapUrl = (i) => `https://www.google.com/maps?q=${i.lat},${i.lng}`;
export const IncidentRow = ({ i }) => (
  <Link to={`/incidents/${i.id}`} className="row">
    <div>
      <b>#{i.id} {i.description || 'No description'}</b>
      <small>{ago(i.created_at)}{i.callsign ? ` · ${i.callsign}` : ' · no unit yet'}</small>
    </div>
    <div className="pills"><Pill v={i.severity} /><Pill v={i.status} /></div>
  </Link>
);
