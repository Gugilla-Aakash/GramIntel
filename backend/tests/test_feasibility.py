from backend.app.services.feasibility import compute_feasibility, pricing_band, category_signals

LAT0 = 17.3835
LNG0 = 78.3222

def _el(name, tags, dlat=0.001, dlon=0.001, base_lat=LAT0, base_lng=LNG0):
    return {"type": "node", "id": hash(name) % 100000, "lat": base_lat + dlat, "lon": base_lng + dlon, "tags": {"name": name, **tags}}

def test_six_signals_populated():
    f = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000, osm_result={"count": 17, "source": "seeded"})
    assert "market_reach" in f
    assert "opportunity_analysis" in f
    assert "swot" in f
    assert "threats" in f
    assert "competitor_map" in f
    assert "product_market_value" in f
    assert "viability" in f
    for k in ["market_reach", "opportunity_analysis", "swot", "threats", "competitor_map", "product_market_value"]:
        assert f[k] is not None

def test_consumer_shop_ratio():
    # W1: live + elements + lat/lng now derives consumers as total_places*35 (not fixed 12480).
    elements = [
        _el("Fresh Grocery", {"shop": "grocery"}, 0.001, 0.001),
        _el("Super Mart", {"shop": "supermarket"}, 0.002, 0.0),
        _el("City Mall", {"shop": "mall"}, 0.0, 0.002),
        _el("Book Store", {"shop": "books"}, 0.003, 0.003),
    ]
    osm = {"count": 12, "source": "live", "elements": elements}
    f = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Retail", 50000, osm_result=osm, lat=LAT0, lng=LNG0)
    assert f["market_reach"]["estimated_consumers"] == 4 * 35
    assert f["market_reach"]["monthly_demand_lakh"] == round(4 * 35 * 45 * 30 / 100000, 1)
    assert f["competitor_map"]["count"] == 3
    assert f["market_reach"]["source"] == "live"

def test_competitor_density():
    f = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000, osm_result={"count": 17, "source": "seeded"})
    density = f["competitor_map"]["density_per_km2"]
    assert 0 < density < 1
    assert density == round(17 / (3.14159 * 10 * 10), 3)

def test_pricing_band_shape():
    band = pricing_band("Dairy")
    assert band["low"] == round(60 * 0.88)
    assert band["high"] == round(60 * 1.12)
    assert "₹" in band["band"]
    f = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000)
    assert f["product_market_value"]["pricing"]["median"] == 60
    assert f["product_market_value"]["pricing"]["low"] < f["product_market_value"]["pricing"]["median"] < f["product_market_value"]["pricing"]["high"]

def test_seeded_fallback():
    f = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000, osm_result=None)
    assert f["source"] == "seeded"
    assert f["competitor_map"]["count"] == 17

def test_viability_weights():
    f = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000)
    factors = f["viability"]["factors"]
    assert len(factors) == 6
    assert f["viability"]["weights"]["demand"] == 0.30
    assert f["viability"]["weights"]["risk"] == 0.10
    assert f["viability"]["score"] > 0

def test_two_locations_differ():
    elements_a = [
        _el("A Dairy", {"shop": "dairy"}, 0.001, 0.001),
        _el("A Milk", {"shop": "milk"}, 0.002, 0.0),
        _el("A Books", {"shop": "books"}, 0.003, 0.001),
        _el("A Clothes", {"shop": "clothes"}, 0.001, 0.003),
    ]
    elements_b = [
        _el(f"B Dairy {i}", {"shop": "dairy"}, 0.001 * (i + 1), 0.001 * (i + 1), base_lat=17.5, base_lng=78.4)
        for i in range(6)
    ] + [
        _el(f"B Other {i}", {"shop": "books"}, 0.002 * (i + 1), 0.001, base_lat=17.5, base_lng=78.4)
        for i in range(4)
    ]
    fa = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000,
                             osm_result={"count": 4, "source": "live", "elements": elements_a}, lat=LAT0, lng=LNG0)
    fb = compute_feasibility("Shadnagar", "Shadnagar", "Rangareddy", "Dairy", 100000,
                             osm_result={"count": 10, "source": "live", "elements": elements_b}, lat=17.5, lng=78.4)
    assert fa["market_reach"]["estimated_consumers"] != fb["market_reach"]["estimated_consumers"]
    assert fa["viability"]["score"] != fb["viability"]["score"]

def test_scores_vary_with_competition():
    small = [_el(f"S Dairy {i}", {"shop": "dairy"}, 0.001 * (i + 1), 0.001) for i in range(3)]
    small.append(_el("S Books", {"shop": "books"}, 0.005, 0.005))
    large = [_el(f"L Dairy {i}", {"shop": "dairy"}, 0.001 * (i + 1), 0.001 * ((i % 5) + 1)) for i in range(25)]
    large.append(_el("L Books", {"shop": "books"}, 0.006, 0.006))
    fs = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000,
                             osm_result={"count": 4, "source": "live", "elements": small}, lat=LAT0, lng=LNG0)
    fl = compute_feasibility("Gandipet", "Gandipet", "Hyderabad", "Dairy", 100000,
                             osm_result={"count": 26, "source": "live", "elements": large}, lat=LAT0, lng=LNG0)
    comp_s = next(f for f in fs["viability"]["factors"] if f["label"] == "COMPETITION")["v"]
    comp_l = next(f for f in fl["viability"]["factors"] if f["label"] == "COMPETITION")["v"]
    dem_s = next(f for f in fs["viability"]["factors"] if f["label"] == "MARKET DEMAND")["v"]
    dem_l = next(f for f in fl["viability"]["factors"] if f["label"] == "MARKET DEMAND")["v"]
    assert comp_s != comp_l
    assert dem_s != dem_l
    assert comp_s == max(5, min(95, 100 - 3 * 8))
    assert comp_l == max(5, min(95, 100 - 25 * 8))
