import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select
from backend.app.main import app
from backend.app.db import get_session
from backend.app.models import OTPStore
from backend.app.config import settings

@pytest.fixture(autouse=True)
def mock_overpass():
    with patch("gramintel.overpass_client.OverpassClient.count_shops_sync", return_value={"count": 17, "source": "seeded", "elements": []}):
        with patch("gramintel.overpass_client.OverpassClient.fetch_sync", return_value={"data": {"elements": []}, "source": "seeded"}):
            yield

TEST_DB = "sqlite:///./test_gramintel.db"
engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})

def get_test_session():
    with Session(engine) as s:
        yield s

app.dependency_overrides[get_session] = get_test_session

settings.ADMIN_EMAILS = "admin@test.com"

@pytest.fixture(autouse=True)
def setup_db():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    # clear in-memory rate-limit and oauth state between tests
    try:
        from backend.app.routers.auth import _otp_rate, _oauth_states
        _otp_rate.clear()
        _oauth_states.clear()
    except Exception:
        pass
    yield
    SQLModel.metadata.drop_all(engine)

client = TestClient(app)

def _auth(email="applicant@test.com", role="applicant"):
    r = client.post("/auth/otp/request", json={"email": email, "role": role})
    assert r.status_code == 200
    with Session(engine) as session:
        code = session.exec(select(OTPStore).where(OTPStore.email == email)).one().code
    r2 = client.post("/auth/otp/verify", json={"email": email, "code": code})
    assert r2.status_code == 200
    return r2.json()["access_token"]

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_auth_happy():
    tok = _auth("alice@test.com", "applicant")
    assert tok

def test_auth_negative():
    r = client.post("/auth/otp/verify", json={"email": "x@test.com", "code": "000000"})
    assert r.status_code == 400

def test_analyze_creates_case():
    tok = _auth("bob@test.com", "applicant")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    j = r.json()
    assert "case_id" in j
    assert j["financial_plan"]["project_cost"] == 1000000
    assert j["feasibility_report"]["market_reach"]["radius_km"] == 10

@pytest.mark.parametrize("lang", ["bn", "mr", "ta"])
def test_analyze_accepts_new_languages(lang):
    tok = _auth(f"{lang}-user@test.com", "applicant")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": lang
    }, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    j = r.json()
    assert "case_id" in j
    assert j["narrative"] is not None

def test_analyze_requires_auth():
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    })
    assert r.status_code == 401

def test_case_submit_and_portal_decision():
    applicant_tok = _auth("applicant2@test.com", "applicant")
    officer_tok = _auth("admin@test.com", "officer")

    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 14000, "business_category": "Retail", "language": "en"
    }, headers={"Authorization": f"Bearer {applicant_tok}"})
    case_id = r.json()["case_id"]

    r2 = client.post("/cases", json={"case_id": case_id}, headers={"Authorization": f"Bearer {applicant_tok}"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "SUBMITTED"

    r3 = client.get(f"/cases/{case_id}", headers={"Authorization": f"Bearer {applicant_tok}"})
    assert r3.status_code == 200
    assert r3.json()["case"]["status"] == "SUBMITTED"

    r4 = client.get("/portal/cases?status=SUBMITTED", headers={"Authorization": f"Bearer {officer_tok}"})
    assert r4.status_code == 200
    assert any(c["id"] == case_id for c in r4.json()["cases"])

    r5 = client.post(f"/cases/{case_id}/decision", json={"decision": "APPROVED", "note": "Good viability"}, headers={"Authorization": f"Bearer {officer_tok}"})
    assert r5.status_code == 200
    assert r5.json()["status"] == "APPROVED"

    r6 = client.get(f"/cases/{case_id}", headers={"Authorization": f"Bearer {applicant_tok}"})
    assert r6.json()["case"]["status"] == "APPROVED"

def test_approved_cases_public_feed():
    applicant_tok = _auth("applicant4@test.com", "applicant")
    officer_tok = _auth("admin@test.com", "officer")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {applicant_tok}"})
    case_id = r.json()["case_id"]
    client.post("/cases", json={"case_id": case_id}, headers={"Authorization": f"Bearer {applicant_tok}"})
    client.post(f"/cases/{case_id}/decision", json={"decision": "APPROVED", "note": "Fund it"}, headers={"Authorization": f"Bearer {officer_tok}"})
    r2 = client.get("/cases/approved")
    assert r2.status_code == 200
    items = r2.json()
    match = next(x for x in items if x["id"] == case_id)
    assert match["village"] == "Gandipet"
    assert match["business_category"] == "Dairy"
    assert match["project_cost"] == 1000000
    assert match["scheme"] == "TERM"
    assert "email" not in match

def test_places_nearby_public():
    sample = {"data": {"elements": [
        {"type": "node", "id": 1, "lat": 17.38, "lon": 78.32, "tags": {"name": "Test Kirana", "shop": "general"}},
        {"type": "node", "id": 2, "lat": 17.39, "lon": 78.33, "tags": {"name": "City Hospital", "amenity": "hospital"}},
    ]}, "source": "live"}
    with patch("gramintel.overpass_client.OverpassClient.fetch_sync", return_value=sample):
        r = client.get("/places/nearby?lat=17.3835&lng=78.3222&radius_m=8000")
    assert r.status_code == 200
    assert len(r.json()["elements"]) == 2
    assert r.json()["source"] == "live"

def test_places_nearby_validates_coords():
    assert client.get("/places/nearby?lat=200&lng=78&radius_m=8000").status_code == 422
    assert client.get("/places/nearby?lat=17&lng=78&radius_m=99999").status_code == 422

def test_role_guard_officer_only():
    applicant_tok = _auth("applicant3@test.com", "applicant")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {applicant_tok}"})
    case_id = r.json()["case_id"]
    client.post("/cases", json={"case_id": case_id}, headers={"Authorization": f"Bearer {applicant_tok}"})
    r2 = client.post(f"/cases/{case_id}/decision", json={"decision": "APPROVED"}, headers={"Authorization": f"Bearer {applicant_tok}"})
    assert r2.status_code == 403

def test_officer_role_cannot_be_self_granted():
    r = client.post("/auth/otp/request", json={"email": "impostor@test.com", "role": "officer"})
    assert r.status_code == 200
    assert r.json()["role"] == "applicant"
    with Session(engine) as session:
        code = session.exec(select(OTPStore).where(OTPStore.email == "impostor@test.com")).one().code
    r2 = client.post("/auth/otp/verify", json={"email": "impostor@test.com", "code": code})
    assert r2.status_code == 200
    assert r2.json()["role"] == "applicant"
    r3 = client.get("/portal/cases", headers={"Authorization": f"Bearer {r2.json()['access_token']}"})
    assert r3.status_code == 403

def test_admin_email_resolves_to_officer():
    r = client.post("/auth/otp/request", json={"email": "admin@test.com", "role": "applicant"})
    assert r.status_code == 200
    assert r.json()["role"] == "officer"
    with Session(engine) as session:
        code = session.exec(select(OTPStore).where(OTPStore.email == "admin@test.com")).one().code
    r2 = client.post("/auth/otp/verify", json={"email": "admin@test.com", "code": code})
    assert r2.status_code == 200
    assert r2.json()["role"] == "officer"

def test_workflow_illegal_transition():
    applicant_tok = _auth("applicant4@test.com", "applicant")
    officer_tok = _auth("admin@test.com", "officer")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {applicant_tok}"})
    case_id = r.json()["case_id"]
    r2 = client.post(f"/cases/{case_id}/decision", json={"decision": "APPROVED"}, headers={"Authorization": f"Bearer {officer_tok}"})
    assert r2.status_code == 400

def test_narrate():
    tok = _auth("narrate@test.com", "applicant")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 50000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {tok}"})
    case_id = r.json()["case_id"]
    r2 = client.post(f"/cases/{case_id}/narrate", json={"language": "hi"}, headers={"Authorization": f"Bearer {tok}"})
    assert r2.status_code == 200
    assert "narrative" in r2.json()
    assert r2.json()["narrative"]["vernacular_summary"] is not None

def test_case_chat_endpoint_streams_for_officer():
    applicant_tok = _auth("chat@test.com", "applicant")
    officer_tok = _auth("admin@test.com", "officer")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {applicant_tok}"})
    case_id = r.json()["case_id"]
    r2 = client.post(
        f"/cases/{case_id}/chat",
        json={"message": "Is this business worth it?", "history": []},
        headers={"Authorization": f"Bearer {officer_tok}"},
    )
    assert r2.status_code == 200
    assert "text/event-stream" in r2.headers["content-type"]
    body = "".join(r2.iter_text())
    assert "data:" in body
    assert "[DONE]" in body

def test_case_chat_allows_applicant_own_case_denies_others():
    applicant_a = _auth("chata@test.com", "applicant")
    ra = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en"
    }, headers={"Authorization": f"Bearer {applicant_a}"})
    case_id = ra.json()["case_id"]
    r_own = client.post(
        f"/cases/{case_id}/chat",
        json={"message": "Is this worth it?"},
        headers={"Authorization": f"Bearer {applicant_a}"},
    )
    assert r_own.status_code == 200
    assert "text/event-stream" in r_own.headers["content-type"]
    body = "".join(r_own.iter_text())
    assert "[DONE]" in body

    other_tok = _auth("chatb@test.com", "applicant")
    r_other = client.post(
        f"/cases/{case_id}/chat",
        json={"message": "Is this worth it?"},
        headers={"Authorization": f"Bearer {other_tok}"},
    )
    assert r_other.status_code == 403

def test_applicant_me_cases():
    tok = _auth("me@test.com", "applicant")
    client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 20000, "business_category": "Textile", "language": "te"
    }, headers={"Authorization": f"Bearer {tok}"})
    r = client.get("/applicant/me/cases", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["count"] >= 1


def test_dataset_exploration_endpoints():
    r_vil = client.get("/assistant/datasets/villages")
    assert r_vil.status_code == 200
    assert r_vil.json()["count"] >= 10

    r_bench = client.get("/assistant/datasets/benchmarks")
    assert r_bench.status_code == 200
    assert "Dairy" in r_bench.json()["benchmarks"]

    r_sch = client.get("/assistant/datasets/schemes")
    assert r_sch.status_code == 200
    assert len(r_sch.json()["schemes"]) >= 2


def test_decision_mail_points_to_customer_care():
    from backend.app.services.email import decision_bodies
    from backend.app.config import settings
    assert settings.CUSTOMER_CARE_EMAIL == "gugillaaakash6@gmail.com"

    class FakeCase:
        id = 1
        village = "Gandipet"
        block = "Gandipet"
        district = "Hyderabad"
        business_category = "Dairy"
        margin_capital = 100000
        language = "en"

    class FakeFin:
        project_cost = 1000000
        max_loan = 900000
        scheme = "TERM"
        interest_rate = 8.0
        tenure_months = 84
        moratorium_months = 6
        emi_monthly = 14028
        emi_quarterly = 42084

    class FakeFeas:
        payload_json = '{"viability": {"score": 72, "grade": "B"}}'

    text, html = decision_bodies(FakeCase(), FakeFin(), FakeFeas(), "APPROVED", "ok", "officer@test.com")
    assert "gugillaaakash6@gmail.com" in text
    assert "gugillaaakash6@gmail.com" in html


def test_middleman_allowlist_role_resolution():
    from backend.app.routers.auth import resolve_role
    from backend.app.config import settings
    settings.OPERATOR_EMAILS = "mitra@test.com"
    settings.ADMIN_EMAILS = "admin@test.com"
    assert resolve_role("admin@test.com") == "officer"
    assert resolve_role("mitra@test.com") == "middleman"
    assert resolve_role("farmer@test.com") == "applicant"


def test_operator_end_to_end_forwarded_case():
    applicant_tok = _auth("farmer2@test.com", "applicant")
    from backend.app.config import settings
    settings.OPERATOR_EMAILS = "mitra2@test.com"
    mitra_tok = _auth("mitra2@test.com", "middleman")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en",
        "farmer_email": "farmer2@test.com", "farmer_name": "Ravi", "farmer_phone": "9000000001",
    }, headers={"Authorization": f"Bearer {mitra_tok}"})
    assert r.status_code == 200
    case_id = r.json()["case_id"]
    mine = client.get("/operator/me/cases", headers={"Authorization": f"Bearer {mitra_tok}"})
    assert mine.status_code == 200
    assert any(c["id"] == case_id for c in mine.json()["cases"])
    farmer_view = client.get("/applicant/me/cases", headers={"Authorization": f"Bearer {applicant_tok}"})
    assert any(c["id"] == case_id for c in farmer_view.json()["cases"])


def test_second_operator_cannot_see_case():
    from backend.app.config import settings
    settings.OPERATOR_EMAILS = "mitra2@test.com,other@test.com"
    mitra_tok = _auth("mitra2@test.com", "middleman")
    other_tok = _auth("other@test.com", "middleman")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en",
        "farmer_email": "farmer2@test.com",
    }, headers={"Authorization": f"Bearer {mitra_tok}"})
    case_id = r.json()["case_id"]
    denied = client.get(f"/cases/{case_id}", headers={"Authorization": f"Bearer {other_tok}"})
    assert denied.status_code == 403
    mine = client.get("/operator/me/cases", headers={"Authorization": f"Bearer {other_tok}"})
    assert all(c["id"] != case_id for c in mine.json()["cases"])


def test_decision_mails_farmer_and_operator():
    from backend.app.config import settings
    settings.OPERATOR_EMAILS = "mitra3@test.com"
    applicant_tok = _auth("farmer3@test.com", "applicant")
    officer_tok = _auth("admin@test.com", "officer")
    mitra_tok = _auth("mitra3@test.com", "middleman")
    r = client.post("/assistant/analyze", json={
        "village": "Gandipet", "block": "Gandipet", "district": "Hyderabad",
        "margin_capital": 100000, "business_category": "Dairy", "language": "en",
        "farmer_email": "farmer3@test.com",
    }, headers={"Authorization": f"Bearer {mitra_tok}"})
    case_id = r.json()["case_id"]
    client.post("/cases", json={"case_id": case_id}, headers={"Authorization": f"Bearer {mitra_tok}"})
    sent = []
    import backend.app.services.email as email_mod
    orig = email_mod._send_email
    email_mod._send_email = lambda to, subj, tb, hb: sent.append(to) or False
    try:
        d = client.post(f"/cases/{case_id}/decision", json={"decision": "APPROVED", "note": "Looks good"},
                        headers={"Authorization": f"Bearer {officer_tok}"})
        assert d.status_code == 200
    finally:
        email_mod._send_email = orig
    assert "farmer3@test.com" in sent and "mitra3@test.com" in sent
