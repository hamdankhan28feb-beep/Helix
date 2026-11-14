from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
DB_PATH = Path(os.getenv("HELIX_DB_PATH", str(BASE.parent / "helix.sqlite3")))
SECRET = os.getenv("HELIX_SECRET", "development-only-change-me")
TOKEN_TTL = 60 * 60 * 12
app = FastAPI(title="HELIX Mission Health API", version="0.1.0", description="Optional Earth sync and synthetic demo stream. Not clinical software.")
origins = [x.strip() for x in os.getenv("HELIX_CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])

def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"

def check_password(password: str, stored: str) -> bool:
    try:
        scheme, salt, digest = stored.split("$")
        if scheme != "scrypt": return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1).hex()
        return hmac.compare_digest(actual, digest)
    except (ValueError, TypeError):
        return False

def b64(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def token_for(crew_id: str) -> str:
    payload = b64(json.dumps({"sub": crew_id, "exp": int(time.time()) + TOKEN_TTL}, separators=(",", ":")).encode())
    signature = b64(hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).digest())
    return payload + "." + signature

def decode_token(token: str) -> str:
    import base64
    try:
        payload, signature = token.split(".", 1)
        expected = b64(hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected): raise ValueError()
        raw = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        data = json.loads(raw)
        if data["exp"] < time.time(): raise ValueError()
        return str(data["sub"])
    except Exception as exc:
        raise HTTPException(401, "Invalid or expired session") from exc

@app.on_event("startup")
def initialize() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as con:
        con.execute("CREATE TABLE IF NOT EXISTS crew (crew_id TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)")
        con.execute("CREATE TABLE IF NOT EXISTS measurements (id INTEGER PRIMARY KEY, crew_id TEXT NOT NULL, indicator_id TEXT NOT NULL, value TEXT NOT NULL, unit TEXT NOT NULL, recorded_at TEXT NOT NULL)")
        con.execute("CREATE TABLE IF NOT EXISTS summary_packets (packet_id TEXT PRIMARY KEY, crew_id TEXT NOT NULL, notes TEXT NOT NULL, packet_json TEXT NOT NULL, recorded_at TEXT NOT NULL)")
        if not con.execute("SELECT 1 FROM crew WHERE crew_id='commander'").fetchone():
            password = os.getenv("HELIX_DEMO_PASSWORD", "commander-demo")
            con.execute("INSERT INTO crew VALUES(?,?,?)", ("commander", hash_password(password), datetime.now(timezone.utc).isoformat()))

def current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to sync this measurement")
    return decode_token(authorization[7:])

class Login(BaseModel):
    crew_id: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    password: str = Field(min_length=10, max_length=128)

class Measurement(BaseModel):
    indicator_id: str
    value: str = Field(max_length=120)
    unit: str = Field(max_length=40)
    recorded_at: datetime | None = None

class Guest(BaseModel):
    profile_id: str = Field(default="guest", max_length=40)

class PacketSubmission(BaseModel):
    id: str | None = Field(default=None, max_length=80)
    notes: str = Field(default="", max_length=4000)

_attempts: dict[str, list[float]] = {}
def rate_limit(key: str) -> None:
    now = time.time(); hits = [t for t in _attempts.get(key, []) if now - t < 300]
    if len(hits) >= 8: raise HTTPException(429, "Too many attempts. Wait a few minutes and try again.")
    hits.append(now); _attempts[key] = hits

@app.get("/health")
def health() -> dict[str, str]: return {"status": "ok", "mode": "synthetic-demo"}

@app.get("/indicators")
def indicators() -> list[dict[str, Any]]:
    data = json.loads((BASE / "indicators.json").read_text(encoding="utf-8"))
    return [{**x, "five_questions": {"what_in_space": f"Can {x['name'].lower()} be measured in space? Yes, with the approved device or self-report described below.", "why": x["why_needed"], "hazards": x["hazard_effects"], "when_attention": x["attention"], "prevention": x["prevention"]}, "how_to_measure": x["how_to_measure"], "status_thresholds": "Not configured; follow mission medical standards."} for x in data]

@app.post("/auth/login")
def login(body: Login, request: Request) -> dict[str, Any]:
    key = request.client.host if request.client else "unknown"
    rate_limit(key)
    with connect() as con: row = con.execute("SELECT password_hash FROM crew WHERE crew_id=?", (body.crew_id,)).fetchone()
    if not row or not check_password(body.password, row[0]): raise HTTPException(401, "Crew ID or password was not recognized")
    _attempts.pop(key, None)
    return {"access_token": token_for(body.crew_id), "token_type": "bearer", "expires_in": TOKEN_TTL, "crew_id": body.crew_id}

@app.post("/auth/guest")
def guest(body: Guest) -> dict[str, Any]:
    return {"profile_id": body.profile_id, "mode": "guest", "sync_enabled": False, "message": "Guest profile is local-first; no account is created."}

@app.post("/measurements")
def save_measurement(body: Measurement, crew_id: str = Depends(current_user)) -> dict[str, Any]:
    recorded = (body.recorded_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
    with connect() as con:
        con.execute("INSERT INTO measurements(crew_id,indicator_id,value,unit,recorded_at) VALUES(?,?,?,?,?)", (crew_id, body.indicator_id, body.value, body.unit, recorded))
    return {"saved": True, "sync_notice": "This measurement was sent to the demo Earth-sync service.", "recorded_at": recorded}

PROFILES = {"commander": {"name":"Commander Demo", "environment":"transit", "gravity_g":0.0, "baseline":{"heart_rate":64,"blood_pressure_systolic":112,"sleep_hours":7.6,"mood_stress":2,"exercise_minutes":50}}, "pilot": {"name":"Pilot Demo", "environment":"station", "gravity_g":0.0, "baseline":{"heart_rate":70,"blood_pressure_systolic":118,"sleep_hours":7.2,"mood_stress":2,"exercise_minutes":45}}, "scientist": {"name":"Scientist Demo", "environment":"lunar_base", "gravity_g":0.16, "baseline":{"heart_rate":68,"blood_pressure_systolic":115,"sleep_hours":7.8,"mood_stress":1,"exercise_minutes":55}}, "engineer": {"name":"Engineer Demo", "environment":"mars_rover", "gravity_g":0.38, "baseline":{"heart_rate":72,"blood_pressure_systolic":120,"sleep_hours":7.1,"mood_stress":3,"exercise_minutes":40}}}
STRESSORS = {"sleep_debt": {"sleep_hours":-2.0,"mood_stress":1}, "missed_exercise":{"exercise_minutes":-25}, "isolation_stress":{"mood_stress":2,"sleep_hours":-0.5}, "bp_creep":{"blood_pressure_systolic":12}, "co2_rise":{"heart_rate":6,"sleep_hours":-0.4}, "radiation_event":{"radiation_relative":12}, "eva_strain":{"heart_rate":8,"exercise_minutes":-10}}

def make_stream(profile_id: str, day: int = 63, stressors: list[str] | None = None) -> dict[str, Any]:
    profile = PROFILES.get(profile_id, PROFILES["commander"]); base = profile["baseline"]; active = stressors or ["sleep_debt", "missed_exercise", "isolation_stress", "bp_creep"]
    effects: dict[str, float] = {}
    for name in active:
        for key, value in STRESSORS.get(name, {}).items(): effects[key] = effects.get(key, 0) + value
    rows = []
    for d in range(max(1, day - 13), day + 1):
        progress = (d - max(1, day - 13)) / 13
        row = {"day": d, "heart_rate": round(base["heart_rate"] + effects.get("heart_rate", 0) * progress), "blood_pressure_systolic": round(base["blood_pressure_systolic"] + effects.get("blood_pressure_systolic", 0) * progress), "sleep_hours": round(max(3.0, base["sleep_hours"] + effects.get("sleep_hours", 0) * progress), 1), "mood_stress": min(5, max(1, round(base["mood_stress"] + effects.get("mood_stress", 0) * progress))), "exercise_minutes": round(max(0, base["exercise_minutes"] + effects.get("exercise_minutes", 0) * progress)), "radiation_relative": round(0.4 + d * 0.013 + effects.get("radiation_relative", 0) * progress, 2), "source": "SYNTHETIC"}
        rows.append(row)
    return {"profile": {"id": profile_id, **profile}, "day": day, "synthetic": True, "stressors": active, "measurements": rows}

@app.get("/stream/{profile_id}")
def stream(profile_id: str, day: int = 63, stressor: list[str] | None = None) -> dict[str, Any]:
    if day < 1 or day > 1000: raise HTTPException(422, "day must be between 1 and 1000")
    return make_stream(profile_id, day, stressor)

def assessment(profile_id: str, day: int = 63, stressors: list[str] | None = None) -> dict[str, Any]:
    sample = make_stream(profile_id, day, stressors); profile = sample["profile"]; latest = sample["measurements"][-1]; base = profile["baseline"]
    regions = {}
    for region, keys in {"heart_vessels":["heart_rate","blood_pressure_systolic"],"mind_sleep":["sleep_hours","mood_stress"],"bones_muscles":["exercise_minutes"]}.items():
        drifts = [min(100, round(abs(latest[k] - base[k]) / max(abs(base[k]), 1) * 100)) for k in keys]
        drift = round(sum(drifts) / len(drifts)); status = "Watch" if drift >= 15 else "Nominal"
        runway_days = max(1, round((100 - drift) / max(1, drift / 5))) if drift else None
        regions[region] = {"drift_percent": drift, "status": status, "runway": f"~{runway_days} days" if runway_days else "Stable", "confidence": "Low", "explanation": "Simple projection from synthetic trends; not a medical forecast."}
    actions = []
    if latest["sleep_hours"] < base["sleep_hours"] - 1: actions.append({"action":"Protect the next scheduled sleep period", "tag":"Recommended", "reason":"Sleep is trending below this crew member's baseline and may compound stress."})
    if latest["exercise_minutes"] < base["exercise_minutes"] - 10: actions.append({"action":"Resume the planned exercise session if fit and cleared", "tag":"Recommended", "reason":"Activity is below the synthetic baseline; exercise supports fitness in reduced gravity."})
    if latest["blood_pressure_systolic"] > base["blood_pressure_systolic"] + 8: actions.append({"action":"Repeat the measurement per mission protocol and review the trend", "tag":"Recommended", "reason":"The synthetic trend is above this demo baseline; use mission guidance."})
    actions = actions or [{"action":"Keep today's planned routine and check in again", "tag":"Recommended", "reason":"No notable change from the synthetic baseline is projected."}]
    return {"synthetic":True,"disclaimer":"Synthetic data and demo status bands only; not clinical thresholds or advice. Runway is a simple trend projection. Follow mission medical standards.","profile":profile,"day":day,"stressors":sample["stressors"],"environment":{"name":profile["environment"],"gravity_g":profile["gravity_g"]},"combined_status":"Watch" if any(x["status"]!="Nominal" for x in regions.values()) else "Nominal","hazard_status":{"space_radiation":"Monitor relative trend; official limits come from NASA standards.","isolation_confinement":"Compounding context: mood and sleep stressors enabled.","distance_from_earth":"Use crew protocol; support may be delayed.","gravity_fields":f"Environment gravity: {profile['gravity_g']} g.","hostile_closed_environments":"Cabin conditions are synthetic context only."},"regions":regions,"one_thing_today":{"primary":actions[0],"backups":actions[1:3]},"latest":latest}

@app.get("/assessment/{profile_id}")
def get_assessment(profile_id: str, day: int = 63, stressor: list[str] | None = None) -> dict[str, Any]:
    return assessment(profile_id, day, stressor)

@app.get("/packet/{profile_id}")
def packet(profile_id: str, day: int = 63) -> dict[str, Any]:
    result = assessment(profile_id, day)
    return {"created_at":datetime.now(timezone.utc).isoformat(),"synthetic":True,"profile":result["profile"],"environment":result["environment"],"combined_status":result["combined_status"],"latest":result["latest"],"regions":result["regions"],"actions":result["one_thing_today"],"status":"QUEUED LOCALLY BY CLIENT WHEN OFFLINE; DEMO API DOES NOT TRANSMIT AUTOMATICALLY","disclaimer":result["disclaimer"]}

@app.post("/packet/{profile_id}")
def save_packet(profile_id: str, body: PacketSubmission, crew_id: str = Depends(current_user)) -> dict[str, Any]:
    generated = packet(profile_id)
    packet_id = body.id or f"PKT-{secrets.token_hex(6).upper()}"
    recorded = datetime.now(timezone.utc).isoformat()
    generated.update({"id": packet_id, "notes": body.notes, "stored_for_demo_sync": True, "created_at": recorded})
    with connect() as con:
        con.execute("INSERT OR REPLACE INTO summary_packets(packet_id,crew_id,notes,packet_json,recorded_at) VALUES(?,?,?,?,?)", (packet_id, crew_id, body.notes, json.dumps(generated), recorded))
    return {"id": packet_id, "status": "stored_for_demo_sync", "recorded_at": recorded, "synthetic": True, "disclaimer": generated["disclaimer"]}
