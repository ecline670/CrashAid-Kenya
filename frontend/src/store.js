import { create } from 'zustand';
import { io } from 'socket.io-client';
import api, { ORIGIN } from './api';

let socket = null;
const byId = (list, patch) => list.map((x) => (x.id === patch.id ? { ...x, ...patch } : x));

export const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  incidents: [], units: [], live: false,

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (!['dispatcher', 'admin'].includes(data.user.role)) throw new Error('Dispatcher access only');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user });
  },
  async logout() {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    localStorage.clear();
    socket?.disconnect(); socket = null;
    set({ user: null, incidents: [], units: [], live: false });
  },
  async load() {
    const [i, u] = await Promise.all([api.get('/incidents'), api.get('/units')]);
    set({ incidents: i.data, units: u.data });
  },
  connect() {
    if (socket) return;
    socket = io(ORIGIN || undefined, { auth: { token: localStorage.getItem('token') } });
    socket.on('connect', () => set({ live: true }));
    socket.on('disconnect', () => set({ live: false }));
    socket.on('incident:new', (i) => set((s) => ({ incidents: [i, ...s.incidents.filter((x) => x.id !== i.id)] })));
    socket.on('incident:update', (p) => set((s) => ({ incidents: byId(s.incidents, p) })));
    socket.on('unit:update', (p) => set((s) => ({ units: byId(s.units, p) })));
  },
}));
