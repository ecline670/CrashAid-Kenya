# AcciRes: CrashAid Kenya dispatcher console

React 18 + Vite, Zustand, Axios, Socket.io-client, React Router, Tabler Icons, DM Sans.
Pages: Login, Dashboard, Incidents, Incident detail, Units, Providers, Settings.

## Run locally
```
npm install
npm run dev     # http://localhost:5173, proxies /api and websockets to the backend on :4000
```
Sign in with the dispatcher account created by `node src/seed.js` in the backend.

## Deploy to Vercel
Import this folder, framework preset Vite. Set `VITE_API_ORIGIN` to your deployed backend URL
(e.g. https://crashaid-api.up.railway.app) and set the backend's `CORS_ORIGIN` to your Vercel URL.
