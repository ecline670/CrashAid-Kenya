import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy API + websockets to the backend on :4000
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000', '/socket.io': { target: 'http://localhost:4000', ws: true } } },
});
