# HELIX — Your body's flight computer

HELIX is an offline-first astronaut self-assessment demo. The existing React/Vite cockpit is served by Express; the Python service supplies optional synthetic mission streams and demo Earth sync. The simulator is synthetic and not clinical.

## Run locally

1. Start FastAPI in one terminal:

   ```powershell
   cd ..\backend
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. In another terminal, start the frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   # Set AUTH_SECRET to a random value before sharing the app.
   npm install
   npm run dev
   ```

Open http://localhost:3000. Demo login: Crew ID `commander`, password `commander-demo`. The first successful login stores a salted local verifier so that the crew profile can be unlocked offline later. Use Guest for a local-only profile.

## Auth.js and Google OAuth

Auth.js uses the existing Express host and its Credentials provider to validate against FastAPI. Set `AUTH_SECRET` and `AUTH_URL` in `.env`. For optional Google sign-in:

1. In Google Cloud Console, create an OAuth 2.0 Client ID with application type **Web application**.
2. Add `http://localhost:3000/auth/callback/google` as an authorized redirect URI for local development.
3. For a deployed host, add `https://YOUR_HOST/auth/callback/google` as an authorized redirect URI and set `AUTH_URL=https://YOUR_HOST`.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The Google option stays hidden if either is missing.

Health readings remain in browser storage by default. The optional API routes persist a measurement only after an authenticated crew member sends it. The flight-surgeon summary is generated and queued; this demo does not transmit it to NASA or a real flight surgeon.

## Offline behavior

The production build registers a service worker and caches the app shell. Indicators, routines, tutorials, self-assessments, and local simulator fixtures remain available without network. State is mirrored into IndexedDB (with localStorage fallback), and pending measurements/packets are queued for retry when the browser comes online. Google sign-in and Earth sync require connectivity.

## Limitations

- Synthetic streams and heuristic demo status bands are illustrative only. They are not clinical thresholds, diagnosis, treatment, or mission procedures.
- Follow approved mission medical standards and contact the flight surgeon for concerning symptoms.
- The demo user password is public and must never be reused. Use a unique `AUTH_SECRET` outside a local demo.
- Auth.js Express integration is currently marked experimental by its maintainers; pin and review versions before production.
