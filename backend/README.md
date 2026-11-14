# HELIX API

Small FastAPI service for optional Earth sync and the synthetic mission stream. Core assessments belong on the device; the API is not required for offline use. This service stores only demo/user identity and explicitly submitted measurements.

## Run

From this directory, create a virtual environment, install `requirements.txt`, set a unique `HELIX_SECRET`, then run:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:HELIX_SECRET = "replace-with-a-long-random-secret"
uvicorn app.main:app --reload
```

Open `/docs`. The seeded demo account is Crew ID `commander`, password `commander-demo` (development demo only; override `HELIX_DEMO_PASSWORD`). SQLite defaults to `helix.sqlite3` in this directory.

## Endpoints

- `GET /health`: liveness.
- `GET /indicators`: indicator definitions and plain-language Five Questions.
- `POST /auth/login`: Crew ID and password; returns a signed bearer token.
- `POST /auth/guest`: device-local guest identity (no account or health-data sync).
- `GET /stream/{profile_id}`: reproducible synthetic multi-day stream; `day` and `stressor` are optional query parameters.
- `POST /measurements`: persist a measurement (demo Earth-sync only).
- `GET /assessment/{profile_id}`: assess sample stream, drift, runway, and One Thing Today.
- `GET /packet/{profile_id}`: compact flight-surgeon summary packet.

- `POST /packet/{profile_id}`: store a summary packet for demo sync (requires a bearer token).

Configuration: `HELIX_SECRET` signs 12-hour bearer tokens; `HELIX_DEMO_PASSWORD` overrides the seeded demo password; `HELIX_DB_PATH` changes the SQLite file path; `HELIX_CORS_ORIGINS` is a comma-separated allowlist (default `http://localhost:3000`). The database defaults to `backend/helix.sqlite3` and is created on startup.

The API intentionally does not set medical thresholds or issue diagnoses. Generated physiological values are synthetic, and trend projections are educational. A real deployment needs reviewed clinical thresholds, secure session lifecycle, TLS, operational controls, and privacy/security review. Passwords are stored as salted scrypt hashes; login attempts are briefly rate-limited in-process for this demo.
