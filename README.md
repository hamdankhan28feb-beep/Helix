# HELIX - Your body's flight computer

HELIX is an offline-first astronaut self-assessment demo. It combines a React cockpit and interactive body twin with guided measurements, plain-language explanations, synthetic mission trends, and a locally prepared flight-surgeon summary. The Express app serves the frontend and optional Auth.js routes; a FastAPI service supplies the synthetic simulator and demo sync endpoints.

**This is a prototype, not clinical software.** All sample profiles, readings, statuses, and runway estimates are synthetic. The app does not diagnose, prescribe treatment, or implement mission medical thresholds. Follow approved mission procedures for health concerns.

## What is implemented

- Clickable 3D anatomy view with a 2D fallback, body-region details, hazard context, and baseline comparisons.
- Guided self-checks, measurement entry, learning/glossary content, and a single explainable daily action.
- Synthetic mission profiles, stressor scenarios, trend charts, and illustrative runway estimates.
- Local-first state and offline queue using IndexedDB with localStorage fallback; a service worker caches the app shell.
- Optional Crew ID authentication, Google OAuth configuration, and authenticated demo measurement/summary sync.
- FastAPI endpoints for indicator definitions, synthetic streams and assessments, and explicitly submitted demo records.

See [DELIVERABLES.md](DELIVERABLES.md) for the architecture, indicator/risk mapping, demo script, challenge coverage, and limitations.

## Run locally

Prerequisites: Node.js with npm and Python 3.10+.

1. Start the API in a terminal:

   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   $env:HELIX_SECRET = "replace-with-a-long-random-secret"
   uvicorn app.main:app --reload --port 8000
   ```

2. In another terminal, start the web app:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   # Set AUTH_SECRET to a unique random value before sharing the app.
   npm install
   npm run dev
   ```

3. Open http://localhost:3000. The development demo account is Crew ID `commander`, password `commander-demo`. Guest mode keeps a local-only profile. See [frontend/README.md](frontend/README.md) for authentication and offline details and [backend/README.md](backend/README.md) for API configuration.

The cockpit can fall back to local synthetic fixtures when the API is unavailable. Google sign-in requires OAuth credentials; the demo Crew ID flow does not.

## Development commands

Run from `frontend/`:

```sh
npm run dev      # Express host and Vite middleware at http://localhost:3000
npm run build    # Production frontend bundle
npm run start    # Express host serving the production bundle
npm run lint     # TypeScript type check
```

Run the backend from `backend/` with `uvicorn app.main:app --reload --port 8000`. Interactive API docs are at http://localhost:8000/docs.

## Data and privacy

Core screens use browser-local state. Signing in enables optional demo synchronization; submitted measurements and summary packets are stored in the backend's SQLite database. This demo service is not connected to NASA or an actual flight surgeon. Configure unique secrets and secure deployment settings before exposing it beyond local development.
