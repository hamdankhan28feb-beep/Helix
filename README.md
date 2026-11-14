# HELIX — Your Body's Flight Computer

> **NASA Space Apps Challenge 2026**  
> **Challenge:** Create Health Monitoring Software for Astronauts on Space Missions  
> **Category:** Human Exploration / Space Exploration / Software  

HELIX is an offline-first astronaut self-assessment and physiological health-monitoring platform designed for long-duration spaceflight (deep-space transit, orbital stations, lunar outposts, and Mars exploration). Grounded in the **NASA Human Research Program (HRP)**, HELIX provides crew members with an intuitive, non-alarmist flight deck to track personal baseline drift, estimate health runway, and take targeted daily countermeasures—even during prolonged communication delays with Earth.

> [!IMPORTANT]
> **Prototype & Synthetic Data Notice:**  
> All astronaut profiles, physiological telemetry, trend projections, and runway estimates in this application are **synthetic demo data**. HELIX provides self-monitoring and early mission alerts only; it **does not diagnose, prescribe treatment, or replace certified clinical medical devices**. Astronauts must follow official mission medical standards and contact the flight surgeon for concerning symptoms.

---

## Key Features

- **3D Ghost Twin & 2D Fallback:**  
  Interactive 3D body model (`Three.js` / `@react-three/fiber`) with 4 toggleable layers (**Skeleton**, **Organs**, **Muscles**, **Suit**). Features an **Earth Baseline Ghost**—a translucent wireframe juxtaposed behind the active model to visualize microgravity cephalic fluid shift and physical deconditioning. Includes an automatic SVG-based 2D fallback for devices without WebGL or when reduced motion is preferred.
- **Health Runway & What-If Simulator:**  
  A predictive gauge computing days remaining until a drifting metric reaches an attention threshold, ordered shortest runway first. Includes an interactive **What-If Simulator** allowing astronauts to preview the runway impact of countermeasures (Sleep +90m, ARED exercise boost, lighter workload, hydration/nutrition, circadian light shift).
- **One Thing Today:**  
  Synthesizes complex physiological signals into a single, high-priority daily action card with NASA HRP evidence tagging (`Recommended` vs. `Under study`), clear rationale, and backup interventions to combat cognitive fatigue.
- **Flight School Onboarding:**  
  A 7-step interactive spotlight walkthrough introducing twin navigation, hotspot tapping, color/glyph keys, reading the runway, One Thing Today, hazard lenses, and logging a live self-check. Unlocks the "Cleared for Flight" badge.
- **90-Second Demo Mode & Hazard Injection:**  
  Interactive timeline scrubber with live stressor injectors: *Solar flare / Radiation event*, *Cabin CO₂ drift*, *Sleep loss & isolation*, and *EVA physical strain*.
- **Crew Baselines & Peer Buddy Check-in:**  
  Interactive comparative slider demonstrating why population averages fail in space (e.g., an identical 68 bpm resting heart rate is Nominal for one astronaut but Caution for another). Features discreet peer buddy check-in prompts (shared galley meal, EVA cross-checking, cupola rest, sleep check-in) that reward the crew by updating their **Connect** ring (+25%).
- **Flight Surgeon Summary Packet:**  
  A one-page delay-aware clinical summary packet with **Transmission Consent Tiers** (`Private`, `Trends`, `Full`), crew notes, transmission state indicators (`idle`, `queued`, `sending`, `delivered`), and one-click plaintext copying.
- **100% Offline-First Architecture:**  
  All core assessments, twin rendering, runway forecasting, Flight School tutorials, and medical emergency checklists function completely offline. State is cached in **IndexedDB** (`helix-local-v1`) with `localStorage` fallback, assets are cached via a PWA service worker, credentials can be unlocked offline via WebCrypto PBKDF2, and pending operations automatically sync when reconnected.

---

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Express 4, Tailwind CSS v4, Three.js / `@react-three/fiber` / `@react-three/drei`, Motion (`motion/react`), Lucide React.
- **Backend:** Python FastAPI, SQLite (`helix.sqlite3`), Pydantic v2, Uvicorn.
- **Authentication:** Auth.js (`@auth/express`) with Credentials provider and optional Google OAuth 2.0.
- **Local Storage:** IndexedDB (`idb` wrapper) + `localStorage` + WebCrypto PBKDF2 offline auth hashing.

---

## Run Locally

### Prerequisites
- **Node.js** (v18+ or v20+) with `npm`
- **Python** (v3.10+)

### 1. Start the FastAPI Mission Backend
Open a terminal and start the Python API service:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:HELIX_SECRET = "replace-with-a-long-random-secret"
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI / Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Cockpit
Open a second terminal, configure environment variables, and start the Express + Vite server:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

- Cockpit Application: `http://localhost:3000`

### 3. Demo Credentials
On the sign-in screen, sign in with the seeded development demo account:
- **Crew ID:** `commander`
- **Password:** `commander-demo`
- **Guest Mode:** Click **Continue as guest** for an instant local-only profile without backend authentication.

> [!NOTE]
> The first successful online sign-in caches a salted PBKDF2 hash on the device, allowing that Crew ID profile to be unlocked even when offline.

---

## Auth.js & Optional Google OAuth

Auth.js runs via the Express host using the Credentials provider to authenticate against FastAPI. Set `AUTH_SECRET` and `AUTH_URL` in `.env`.

To enable optional Google OAuth sign-in:
1. In Google Cloud Console, create an OAuth 2.0 Client ID for a **Web application**.
2. Add `http://localhost:3000/auth/callback/google` to the **Authorized redirect URIs**.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. The Google button automatically appears once configured.

---

## Development Scripts

Run from the `frontend/` directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Express server with embedded Vite middleware on `http://localhost:3000` |
| `npm run build` | Compiles production client bundle to `dist/` |
| `npm run start` | Runs Express server in production mode serving static `dist/` assets |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

To verify backend endpoints, run from `backend/`:
```powershell
python test_api.py
```

---

## Data Privacy & Offline Sync

All astronaut self-check readings, private context notes, and active adjustments are stored locally on the client device. Explicitly submitted measurements and flight surgeon packets are queued in IndexedDB when offline and synchronized to the backend service over authenticated channels when connectivity resumes. This demo does not transmit data to external servers or real flight surgeons.
