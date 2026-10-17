# CrashAid Kenya

CrashAid Kenya is an emergency incident-dispatch system with a React/Vite dispatcher console and a Node/Express API backed by PostgreSQL/PostGIS and Redis/BullMQ.

## Run the complete stack with Docker Compose

Requirements: Docker Engine with Docker Compose v2.

```bash
git clone https://github.com/ecline670/CrashAid-Kenya.git
cd CrashAid-Kenya

docker compose up --build
```

Open the dispatcher console at <http://localhost:8080>.

The default local administrator credentials are:

```text
Email:    dispatcher@example.com
Password: dispatcher-password-change-me
```

Change them before using the stack beyond local development by setting `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` in a root `.env` file. The backend API is also exposed at <http://localhost:4000>; its health endpoint is <http://localhost:4000/health>.

To stop the stack while preserving database data:

```bash
docker compose down
```

To remove the local database and Redis volumes as well:

```bash
docker compose down -v
```

## Reusable repository delivery skill

This repository was prepared using the reusable Manus skill `repo-review-container-delivery`, which standardizes the process of reviewing an existing application, making focused fixes or feature additions, containerizing the full stack, and automating Docker image delivery.

Use the skill when working on a repository that needs a repeatable engineering handoff. It covers repository inventory and architecture explanation, dependency installation and local verification, focused bug fixes, Docker Compose setup for application services and dependencies, and GitHub Actions publishing to the GitHub Container Registry.

The standard workflow is:

1. Inspect the repository structure, documentation, entrypoints, and recent history.
2. Run the available builds, tests, syntax checks, and health checks before making changes.
3. Fix a concrete defect and add a small, domain-aligned feature when requested.
4. Add environment templates, Dockerfiles, Compose services, health checks, persistent volumes, and frontend reverse-proxy configuration as needed.
5. Add a GitHub Actions workflow that builds and publishes each service image with Buildx caching and GHCR authentication.
6. Re-run verification and report exactly what was tested, including any unavailable tooling such as Docker.

The skill is distributed separately from the application at [`/home/ubuntu/skills/repo-review-container-delivery/SKILL.md`](file:///home/ubuntu/skills/repo-review-container-delivery/SKILL.md). It is intended for Manus use and is not required to run the application.

## Run services individually

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for non-Compose development instructions.
