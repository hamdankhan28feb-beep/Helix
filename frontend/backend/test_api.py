import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_helix_api():
    print("Testing /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    print("Health OK:", r.json())

    print("Testing /indicators...")
    r = client.get("/indicators")
    assert r.status_code == 200, f"Indicators failed: {r.status_code}"
    indicators = r.json()
    assert len(indicators) >= 9, f"Expected >=9 indicators, got {len(indicators)}"
    print(f"Indicators OK: {len(indicators)} indicators loaded")

    print("Testing /auth/login with commander...")
    r = client.post("/auth/login", json={"crew_id": "commander", "password": "commander-demo"})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    login_data = r.json()
    token = login_data["access_token"]
    print("Login OK. Access token obtained.")

    print("Testing /stream/commander...")
    r = client.get("/stream/commander?day=63")
    assert r.status_code == 200, f"Stream failed: {r.status_code}"
    stream = r.json()
    assert len(stream["measurements"]) == 14, f"Expected 14 days, got {len(stream['measurements'])}"
    print(f"Stream OK: day {stream['day']}, {len(stream['measurements'])} data points")

    print("Testing /assessment/commander...")
    r = client.get("/assessment/commander?day=63")
    assert r.status_code == 200, f"Assessment failed: {r.status_code}"
    assessment = r.json()
    print("Assessment OK: combined_status =", assessment["combined_status"])

    headers = {"Authorization": f"Bearer {token}"}
    print("Testing authenticated POST /measurements...")
    r = client.post("/measurements", json={"indicator_id": "heart_rate", "value": "74", "unit": "bpm"}, headers=headers)
    assert r.status_code == 200, f"Measurement sync failed: {r.status_code}"
    print("Measurement sync OK:", r.json())

    print("Testing authenticated POST /packet/commander...")
    r = client.post("/packet/commander", json={"notes": "Feeling slight cephalad pressure on day 63."}, headers=headers)
    assert r.status_code == 200, f"Packet sync failed: {r.status_code}"
    print("Packet sync OK:", r.json())

    print("\n>>> ALL 7 BACKEND API ENDPOINTS PASSED VERIFICATION! <<<")

if __name__ == "__main__":
    test_helix_api()
