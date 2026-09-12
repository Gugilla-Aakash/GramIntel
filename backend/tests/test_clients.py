import json
import httpx
from gramintel.groq_client import GroqClient
from gramintel.overpass_client import OverpassClient
from gramintel.api_client import GramIntelAPI

def test_groq_fallback_when_no_key():
    c = GroqClient(api_key=None)
    res = c.generate_sync(business_category="Dairy", village="Gandipet", margin=100000, project_cost=1000000, loan=900000, scheme="TERM", language="hi", signals={}, interest_rate=8.0, tenure_years=7, buffer=13972)
    assert res["_model"] == "template"
    assert "vernacular_summary" in res
    assert res["swot"] is not None

def test_groq_with_mock_transport():
    def handler(request: httpx.Request):
        assert "api.groq.com" in str(request.url)
        return httpx.Response(200, json={
            "choices": [{"message": {"content": json.dumps({"swot": {"strengths": "s"}, "opportunity_insight": "oi", "threats_note": "tn", "pricing_note": "pn", "vernacular_summary": "vs"})}}]
        })
    transport = httpx.MockTransport(handler)
    c = GroqClient(api_key="test-key", transport=transport)
    res = c.generate_sync(business_category="Dairy", village="Gandipet", margin=100000, project_cost=1000000, loan=900000, scheme="TERM", language="en", signals={}, buffer=13972)
    assert res["_model"] == "openai/gpt-oss-20b"
    assert res["_source"] == "groq"
    assert res["vernacular_summary"] == "vs"

def test_groq_mock_retry_on_429_then_success():
    calls = {"n": 0}
    def handler(request: httpx.Request):
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(429, headers={"Retry-After": "0.1"}, json={"error": "rate"})
        return httpx.Response(200, json={
            "choices": [{"message": {"content": json.dumps({"swot": "s", "opportunity_insight": "oi", "threats_note": "tn", "pricing_note": "pn", "vernacular_summary": "vs"})}}]
        })
    transport = httpx.MockTransport(handler)
    c = GroqClient(api_key="k", transport=transport)
    res = c.generate_sync(business_category="Retail", village="Test", margin=50000, project_cost=500000, loan=450000, scheme="TERM", language="en", signals={})
    assert calls["n"] == 2
    assert res["vernacular_summary"] == "vs"

def test_overpass_mock_live():
    def handler(request: httpx.Request):
        return httpx.Response(200, json={"elements": [{"id": 1, "lat": 17.38, "lon": 78.32, "tags": {"shop": "supermarket", "name": "Test Shop"}}, {"id": 2, "lat": 17.39, "lon": 78.33, "tags": {"name": "Temple", "amenity": "place_of_worship"}}]})
    transport = httpx.MockTransport(handler)
    c = OverpassClient(transport=transport)
    res = c.count_shops_sync(17.3835, 78.3222, 8000)
    assert res["source"] == "live"
    assert res["count"] == 1

def test_overpass_fallback_to_seeded_on_failure():
    def handler(request: httpx.Request):
        return httpx.Response(500, json={"error": "bad"})
    transport = httpx.MockTransport(handler)
    c = OverpassClient(transport=transport)
    res = c.count_shops_sync(17.3835, 78.3222, 8000)
    assert res["source"] == "seeded"
    assert res["count"] == 17

def test_groq_stream_chat_fallback_when_no_key():
    import asyncio
    c = GroqClient(api_key=None)
    summary = {
        "business_category": "Dairy", "village": "Gandipet", "block": "Gandipet",
        "district": "Hyderabad", "margin_capital": 100000,
        "financial": {"project_cost": 1000000, "max_loan": 900000, "scheme": "TERM",
                      "interest_rate": 8.0, "tenure_months": 84, "moratorium_months": 6,
                      "emi_monthly": 14028, "emi_quarterly": 42084, "total_interest": 278000},
        "feasibility": {"viability": {"score": 72, "grade": "B", "factors": []},
                        "market_reach": {"radius_km": 10, "estimated_consumers": 25000,
                                         "similar_businesses": 5, "monthly_demand_lakh": 45.0, "source": "seeded"},
                        "competitor_map": {"count": 17, "radius_km": 10, "density_per_km2": 0.05, "source": "seeded"},
                        "opportunity_analysis": {"niches": [{"niche": "A2 milk", "score": 85}], "top_niche": "A2 milk"},
                        "swot": {"strengths": ["Local demand"], "weaknesses": ["Working capital"], "threats": ["Seasonality"]}},
    }
    chunks = []
    async def run():
        async for chunk in c.stream_chat(summary, "Is this worth it?", []):
            chunks.append(chunk)
    asyncio.run(run())
    assert len(chunks) == 1
    assert "viability" in chunks[0].lower() or "offline" in chunks[0].lower()

def test_groq_stream_chat_with_mock_transport():
    import asyncio
    sse_body = 'data: {"choices": [{"delta": {"content": "Hello "}}]}\n\ndata: {"choices": [{"delta": {"content": "world"}}]}\n\ndata: [DONE]\n\n'
    def handler(request: httpx.Request):
        return httpx.Response(200, content=sse_body, headers={"Content-Type": "text/event-stream"})
    transport = httpx.MockTransport(handler)
    c = GroqClient(api_key="test-key", transport=transport)
    summary = {"business_category": "Dairy", "village": "Gandipet", "block": "Gandipet",
               "district": "Hyderabad", "margin_capital": 100000,
               "financial": {"project_cost": 1000000, "max_loan": 900000, "scheme": "TERM",
                             "interest_rate": 8.0, "tenure_months": 84, "moratorium_months": 6,
                             "emi_monthly": 14028, "emi_quarterly": 42084, "total_interest": 278000},
               "feasibility": {"viability": {"score": 72, "grade": "B", "factors": []}}}
    chunks = []
    async def run():
        async for chunk in c.stream_chat(summary, "Question?", []):
            chunks.append(chunk)
    asyncio.run(run())
    assert chunks == ["Hello ", "world"]

def test_groq_stream_chat_language_passed_to_prompt():
    import asyncio, json as _json
    captured = {}
    def handler(request: httpx.Request):
        captured["body"] = _json.loads(request.content)
        return httpx.Response(200, content='data: {"choices": [{"delta": {"content": "ok"}}]}\n\ndata: [DONE]\n\n',
                              headers={"Content-Type": "text/event-stream"})
    transport = httpx.MockTransport(handler)
    c = GroqClient(api_key="test-key", transport=transport)
    summary = {"business_category": "Dairy", "village": "Gandipet", "block": "Gandipet",
               "district": "Hyderabad", "margin_capital": 100000,
               "financial": {"project_cost": 1000000, "max_loan": 900000, "scheme": "TERM",
                             "interest_rate": 8.0, "tenure_months": 84, "moratorium_months": 6,
                             "emi_monthly": 14028, "emi_quarterly": 42084},
               "feasibility": {}}
    async def run():
        async for _chunk in c.stream_chat(summary, "Hello", [], "te"):
            pass
    asyncio.run(run())
    system = captured["body"]["messages"][0]["content"]
    assert "Respond only in Telugu" in system
    assert captured["body"]["messages"][-1]["content"] == "Hello"

def test_groq_stream_chat_multilingual_offline_fallback():
    import asyncio
    c = GroqClient(api_key=None)
    summary = {"business_category": "Dairy", "village": "Gandipet", "block": "Gandipet",
               "district": "Hyderabad", "margin_capital": 100000,
               "financial": {"project_cost": 1000000, "max_loan": 900000, "scheme": "TERM",
                             "interest_rate": 8.0, "tenure_months": 84, "moratorium_months": 6,
                             "emi_monthly": 14028, "emi_quarterly": 42084, "total_interest": 278000},
               "feasibility": {"viability": {"score": 72, "grade": "B", "factors": []},
                               "market_reach": {"radius_km": 10, "estimated_consumers": 25000,
                                                "similar_businesses": 5, "monthly_demand_lakh": 45.0, "source": "seeded"}}}
    async def run(lang):
        out = []
        async for chunk in c.stream_chat(summary, "Q", [], lang):
            out.append(chunk)
        return "".join(out)
    te = asyncio.run(run("te"))
    assert "ఆఫ్" in te
    hi = asyncio.run(run("hi"))
    assert "ऑफ़लाइन" in hi
    en = asyncio.run(run("en"))
    assert "offline assessment" in en

def test_groq_stream_chat_bn_mr_ta_offline_fallback():
    import asyncio
    c = GroqClient(api_key=None)
    summary = {"business_category": "Dairy", "village": "Gandipet", "block": "Gandipet",
               "district": "Hyderabad", "margin_capital": 100000,
               "financial": {"project_cost": 1000000, "max_loan": 900000, "scheme": "TERM",
                             "interest_rate": 8.0, "tenure_months": 84, "moratorium_months": 6,
                             "emi_monthly": 14028, "emi_quarterly": 42084, "total_interest": 278000},
               "feasibility": {"viability": {"score": 72, "grade": "B", "factors": []},
                               "market_reach": {"radius_km": 10, "estimated_consumers": 25000,
                                                "similar_businesses": 5, "monthly_demand_lakh": 45.0, "source": "seeded"}}}
    async def run(lang):
        out = []
        async for chunk in c.stream_chat(summary, "Q", [], lang):
            out.append(chunk)
        return "".join(out)
    bn = asyncio.run(run("bn"))
    assert "অফলাইন" in bn
    mr = asyncio.run(run("mr"))
    assert "ऑफलाइन" in mr
    ta = asyncio.run(run("ta"))
    assert "ஆஃப்லைன்" in ta

def test_groq_fallback_bn_mr_ta_templates():
    c = GroqClient(api_key=None)
    markers = {"bn": "ব্যবসা", "mr": "व्यवसाय", "ta": "தொழில்"}
    for lang, marker in markers.items():
        res = c.generate_sync(business_category="Dairy", village="Gandipet", margin=100000, project_cost=1000000, loan=900000, scheme="TERM", language=lang, signals={}, interest_rate=8.0, tenure_years=7, buffer=13972)
        assert res["_model"] == "template", lang
        assert marker in res["vernacular_summary"], lang
        assert marker in res["opportunity_insight"], lang


def test_groq_prompt_uses_bn_mr_ta_language_names():
    import json as _json
    for lang, name in [("bn", "Bengali"), ("mr", "Marathi"), ("ta", "Tamil")]:
        captured = {}

        def handler(request: httpx.Request):
            captured["body"] = _json.loads(request.content)
            return httpx.Response(200, json={
                "choices": [{"message": {"content": _json.dumps({"swot": {"strengths": "s"}, "opportunity_insight": "oi", "threats_note": "tn", "pricing_note": "pn", "vernacular_summary": "vs"})}}]
            })

        transport = httpx.MockTransport(handler)
        c = GroqClient(api_key="test-key", transport=transport)
        c.generate_sync(business_category="Dairy", village="Gandipet", margin=100000, project_cost=1000000, loan=900000, scheme="TERM", language=lang, signals={}, buffer=13972)
        prompt = captured["body"]["messages"][0]["content"]
        assert name in prompt, lang


def test_gramintel_api_mock():
    def handler(request: httpx.Request):
        if request.url.path == "/health":
            return httpx.Response(200, json={"status": "ok", "version": "0.1.0"})
        if request.url.path == "/auth/otp/request":
            return httpx.Response(200, json={"message": "OTP sent", "provider": "console"})
        return httpx.Response(404, json={"detail": "not found"})
    transport = httpx.MockTransport(handler)
    api = GramIntelAPI(base_url="http://test", transport=transport)
    assert api.health()["status"] == "ok"
    assert api.request_otp("a@test.com", "applicant")["provider"] == "console"
