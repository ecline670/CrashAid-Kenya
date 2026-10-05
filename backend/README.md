# CrashAid Kenya: Backend

Node 20, Express 5, PostgreSQL 15 + PostGIS, Redis, BullMQ, Socket.io, JWT.

## Run locally
```
cp .env.example .env        # set JWT_SECRET
docker compose up -d --build
# tables and the dispatcher login (ADMIN_EMAIL / ADMIN_PASSWORD) are created automatically on first start
```
API: http://localhost:4000 (health: /health)

## Endpoints
- POST /api/auth/register | login | logout, GET /api/auth/me
- POST /api/incidents (any signed-in user: {lat,lng,severity,description}) triggers auto-dispatch to the nearest available ambulance
- GET /api/incidents, GET /api/incidents/:id, PATCH /api/incidents/:id/status (staff)
- GET /api/units, PATCH /api/units/:id/location, GET /api/providers (staff)
- Socket.io events: incident:new, incident:update, unit:update (pass the JWT as `auth.token`)

## Deploy (Railway / Render)
Create the service from this folder, set the env vars from .env.example, use Neon or Supabase for Postgres
(tables are created automatically on first start) and a Redis that allows constant connections (Railway or Render Redis; free serverless Redis plans can hit command limits with BullMQ). Set CORS_ORIGIN to your Vercel URL.
