# Sample App

A small, deliberately boring Node.js + Express app with a `/health` endpoint.
Use this as the "app under test" for anything you're building around it (CI/CD,
container orchestration, preview environments, etc.) — it has no dependencies
beyond Express, no database, and nothing fancy.

## Endpoints

| Method | Path         | Purpose                                          |
|--------|--------------|---------------------------------------------------|
| GET    | `/`          | Simple HTML info page (hostname, version, uptime) |
| GET    | `/health`    | JSON health check (status, uptime, hostname)      |
| GET    | `/livez`     | Plain-text liveness probe                         |
| GET    | `/readyz`    | Plain-text readiness probe                        |
| GET    | `/api/echo`  | Echoes query params + hostname (for confirming which instance answered) |

## Run locally (no Docker)

```bash
npm install
npm start
# App on http://localhost:3000
# Health check: http://localhost:3000/health
```

## Run with Docker

```bash
docker build -t sample-app .
docker run -p 3000:3000 sample-app
# App on http://localhost:3000
```

## Environment variables (all optional)

| Variable      | Default | Purpose                                   |
|---------------|---------|--------------------------------------------|
| `PORT`        | `3000`  | Port the server listens on                 |
| `APP_VERSION` | `1.0.0` | Shown on `/` and `/health`, useful for confirming which build is deployed |
| `PR_NUMBER`   | (none)  | Shown on `/` and `/api/echo` — set this in your deploy step to visually confirm which PR/environment you're looking at |

## Quick smoke test

```bash
curl -s localhost:3000/health | jq
```

Expected:
```json
{
  "status": "ok",
  "hostname": "...",
  "uptime_seconds": 3,
  "started_at": "2026-09-07T...",
  "version": "1.0.0"
}
```
