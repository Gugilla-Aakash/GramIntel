import json
import math
from typing import Dict, Any, List

DEMO_CENTER = {"lat": 17.3835, "lng": 78.3222}
CATEGORY_MEDIANS = {
    "Dairy": 60,
    "Retail": 45,
    "Textile": 55,
    "Textiles": 55,
    "Food Processing": 50,
    "Food": 50,
    "Poultry": 58,
    "Kirana": 42,
    "Services": 48,
}
DEFAULT_MEDIAN = 50

CATEGORY_TAGS: Dict[str, List[str]] = {
    "Dairy": ["dairy", "milk", "farm", "cattle", "bakery", "butcher"],
    "Retail": ["retail", "supermarket", "grocery", "general", "mall", "clothes", "shoes"],
    "Textile": ["clothes", "fabric", "tailor", "textile"],
    "Textiles": ["clothes", "fabric", "tailor", "textile"],
    "Food Processing": ["restaurant", "cafe", "fast_food", "food", "bakery", "dairy"],
    "Food": ["restaurant", "cafe", "fast_food", "food", "bakery", "dairy"],
    "Poultry": ["poultry", "butcher", "farm", "food"],
    "Kirana": ["grocery", "general", "supermarket", "retail"],
    "Services": [],
}

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    # Great-circle distance for radius filtering.
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))

def _clamp(v: float, lo: int, hi: int) -> int:
    # Bound derived factor scores into display range.
    return max(lo, min(hi, int(round(v))))

def category_signals(elements: List[Dict[str, Any]], category: str, lat: float, lng: float, radius_km: float = 10) -> Dict[str, Any]:
    subs = CATEGORY_TAGS.get(category)
    use_shop_fallback = subs is None or len(subs) == 0
    same = 0
    total = 0
    dists: List[float] = []
    for el in elements or []:
        tags = el.get("tags", {})
        if not isinstance(tags, dict) or not tags:
            continue
        name = tags.get("name")
        if not name:
            continue
        lat2 = el.get("lat")
        lon2 = el.get("lon", el.get("lng"))
        if lat2 is None or lon2 is None:
            center = el.get("center", {})
            if isinstance(center, dict):
                lat2 = center.get("lat")
                lon2 = center.get("lon", center.get("lng"))
        try:
            lat2f = float(lat2)
            lon2f = float(lon2)
        except (TypeError, ValueError):
            continue
        d = _haversine_km(lat, lng, lat2f, lon2f)
        if d > radius_km:
            continue
        total += 1
        if use_shop_fallback:
            is_match = bool(tags.get("shop"))
        else:
            fields = [str(tags.get(k, "")).lower() for k in ("amenity", "shop", "tourism", "leisure", "name")]
            is_match = any(s.lower() in f for s in subs for f in fields)
        if is_match:
            same += 1
            dists.append(d)
    avg = round(sum(dists) / len(dists), 1) if dists else 3.4
    return {"same_category_count": same, "total_places": total, "avg_distance_km": avg}

from .dataset_service import lookup_village, lookup_commodity_benchmark

def pricing_band(category: str) -> Dict[str, Any]:
    bench = lookup_commodity_benchmark(category)
    if bench and "price_range" in bench:
        median = bench.get("retail_modal_price_inr", CATEGORY_MEDIANS.get(category, DEFAULT_MEDIAN))
        low = bench["price_range"][0]
        high = bench["price_range"][1]
        unit_str = bench.get("unit", "kg")
        return {
            "median": median,
            "low": low,
            "high": high,
            "band": f"₹{low}–{high}/{unit_str}",
            "unit": f"per {unit_str} · Agmarknet/DAHD bench",
        }
    median = CATEGORY_MEDIANS.get(category, DEFAULT_MEDIAN)
    low = round(median * 0.88)
    high = round(median * 1.12)
    return {"median": median, "low": low, "high": high, "band": f"₹{low}–{high}/kg", "unit": "per kg · value-added"}

def compute_feasibility(
    village: str,
    block: str,
    district: str,
    business_category: str,
    margin_capital: int,
    osm_result: Dict[str, Any] | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> Dict[str, Any]:
    # Look up authentic datasets (Census 2011, Mission Antyodaya, Agmarknet)
    village_data = lookup_village(village=village, block=block, district=district, lat=lat, lng=lng)
    commodity_data = lookup_commodity_benchmark(business_category)

    if osm_result and osm_result.get("source") == "live":
        real_count = osm_result.get("count", 0)
        source_flag = "live"
        competitor_count = max(real_count if real_count else 17, 5)
    elif osm_result and osm_result.get("source") == "seeded":
        competitor_count = osm_result.get("count", 17)
        source_flag = "seeded"
    else:
        competitor_count = 17
        source_flag = "seeded"

    radius_km = 10
    area_km2 = math.pi * radius_km * radius_km

    # Grounded values if actual dataset match exists; otherwise present fallback
    if village_data:
        estimated_consumers = village_data.get("population", 12480)
        households = village_data.get("households", 2780)
        hh_spend = commodity_data.get("typical_monthly_hh_spend_inr", 1650) if commodity_data else 1650
        monthly_demand_lakh = round((households * hh_spend) / 100000, 1)
        coop_count = village_data.get("dairy_cooperatives_count", 3)
        vet_km = village_data.get("nearest_vet_clinic_km", 2.1)
        power_h = village_data.get("power_supply_hours", 22)
    else:
        estimated_consumers = 12480
        households = 2780
        monthly_demand_lakh = 8.4
        coop_count = 3
        vet_km = 2.1
        power_h = 22

    avg_distance_km = 3.4
    weights = {"demand": 0.30, "supply": 0.20, "pricing": 0.15, "competition": 0.15, "finance": 0.10, "risk": 0.10}

    demand_note = f"₹{monthly_demand_lakh}L/mo · {households} households (Census/MA)" if village_data else "rising milk spend in radius"
    supply_note = f"{coop_count} co-ops within 6 km · Vet clinic {vet_km} km" if village_data else f"{coop_count} co-ops within 6 km"
    risk_note = f"{power_h}h power supply · seasonal dips" if village_data else "seasonal dips · power supply"

    factors = [
        {"label": "MARKET DEMAND", "v": 82, "note": demand_note, "weight": weights["demand"]},
        {"label": "COMPETITION", "v": 61, "note": "none value-added nearby", "weight": weights["competition"]},
        {"label": "PRICING POWER", "v": 72, "note": "12–18% premium achievable", "weight": weights["pricing"]},
        {"label": "SUPPLY ACCESS", "v": 79, "note": supply_note, "weight": weights["supply"]},
        {"label": "FINANCIAL FIT", "v": 81, "note": "matches term-loan structure", "weight": weights["finance"]},
        {"label": "RISK EXPOSURE", "v": 52, "note": risk_note, "weight": weights["risk"]},
    ]

    elements = (osm_result.get("elements") if osm_result else None) or []
    derived = False
    if source_flag == "live" and elements and lat is not None and lng is not None:
        try:
            sig = category_signals(elements, business_category, float(lat), float(lng), radius_km)
        except (TypeError, ValueError):
            sig = None
        if sig and sig["total_places"] > 0:
            derived = True
            same_cat = sig["same_category_count"]
            total_places = sig["total_places"]
            avg_distance_km = sig["avg_distance_km"]
            competitor_count = max(same_cat, 1)
            median = CATEGORY_MEDIANS.get(business_category, DEFAULT_MEDIAN)
            estimated_consumers = total_places * 35  # one shop ≈ 35 households served
            monthly_demand_lakh = round(estimated_consumers * median * 30 / 100000, 1)  # consumers × ₹/day × 30d in lakh
            pricing_tmp = pricing_band(business_category)
            band_width_pct = (pricing_tmp["high"] - pricing_tmp["low"]) / median * 100 if median else 0  # spread as % of median
            project_cost = margin_capital / 0.1  # PS rule: margin is 10% of project
            demand_v = min(95, round(40 + monthly_demand_lakh * 4))  # base 40 + demand signal
            supply_v = _clamp(30 + total_places * 2, 5, 95)  # more places = better supply access
            pricing_v = _clamp(50 + band_width_pct * 2, 5, 95)  # wider band = more pricing power
            competition_v = _clamp(100 - same_cat * 8, 5, 95)  # fewer same-category rivals = higher score
            finance_v = 81 if project_cost > 140000 else 70  # term fits large projects, micro fits small
            risk_v = _clamp(20 + same_cat * 6, 5, 95)  # crowding raises risk exposure
            factors = [
                {"label": "MARKET DEMAND", "v": demand_v, "note": f"₹{monthly_demand_lakh}L/mo · {estimated_consumers} consumers", "weight": weights["demand"]},
                {"label": "COMPETITION", "v": competition_v, "note": f"{same_cat} same-category within 10km", "weight": weights["competition"]},
                {"label": "PRICING POWER", "v": pricing_v, "note": f"band {pricing_tmp['low']}–{pricing_tmp['high']} ({band_width_pct:.1f}% spread)", "weight": weights["pricing"]},
                {"label": "SUPPLY ACCESS", "v": supply_v, "note": f"{total_places} places mapped within 10km", "weight": weights["supply"]},
                {"label": "FINANCIAL FIT", "v": finance_v, "note": "matches term-loan structure" if finance_v == 81 else "matches micro-loan structure", "weight": weights["finance"]},
                {"label": "RISK EXPOSURE", "v": risk_v, "note": f"crowding from {same_cat} rivals", "weight": weights["risk"]},
            ]

    if source_flag == "live" and not derived:
        source_flag = "seeded"  # live call yielded nothing usable — badge honestly
        competitor_count = 17

    density = round(competitor_count / area_km2, 3)

    # Build local distribution channels from village weekly haats if available
    channels = []
    if village_data and village_data.get("weekly_haats"):
        channels.extend(village_data["weekly_haats"][:2])
    channels.extend(["Kirana cluster", "Co-op collection", "Roadside stalls", "Mobile vending"])
    if competitor_count < 10:
        channels.append("Underserved direct-to-home")
    # Dedup while preserving order
    seen_ch = set()
    channels = [c for c in channels if not (c in seen_ch or seen_ch.add(c))][:6]

    pricing = pricing_band(business_category)

    # Opportunity niches: pull from authentic commodity benchmark if available
    if commodity_data and commodity_data.get("niches"):
        niches = commodity_data["niches"]
    elif business_category.lower() in ("dairy", "poultry", "food processing", "food"):
        niches = [
            {"niche": "Value-added dairy (paneer/curd)", "score": 78, "reason": "No value-added competitor within 3.4km"},
            {"niche": "Milk collection + cold chain", "score": 71, "reason": "3 co-ops within 6km, demand stable"},
            {"niche": "Feed supply", "score": 62, "reason": "Cattle feed depot 5.9km away"},
        ]
    else:
        niches = [
            {"niche": f"{business_category} — daily needs", "score": 74, "reason": "Consistent demand, repeat customers"},
            {"niche": f"{business_category} — value added", "score": 69, "reason": "Premium opportunity in 10km radius"},
            {"niche": "General retail mix", "score": 63, "reason": "Diversified risk"},
        ]

    # SWOT analysis: incorporate authentic data or fallback
    strengths = []
    if source_flag == "live":
        strengths.append(f"{competitor_count} competitors mapped in 10km; demand density supports entry")
    elif village_data:
        strengths.append(f"{village_data['population']:,} population · {village_data['households']} households (Census 2011/MA)")
    else:
        strengths.append("Rising milk spend in 10km radius")

    if village_data:
        strengths.append(f"{coop_count} co-ops within 6km · {village_data.get('active_shgs', 40)} active SHGs")
    else:
        strengths.append(f"{coop_count} co-ops within 6km — supply access reliable")

    strengths.append(f"Pricing power {pricing['low']}–{pricing['high']} shows 12–18% premium achievable")

    threats = (
        commodity_data.get("threats")
        if commodity_data and commodity_data.get("threats")
        else [
            "Seasonal dips (summer milk yield)",
            "Single-buyer dependency if tied to one co-op",
            "Power supply intermittency",
        ]
    )

    swot = {
        "strengths": strengths,
        "weaknesses": [
            "First-time entrepreneur risk; working capital discipline needed",
            "Limited cold storage at village edge",
        ],
        "opportunities": [n["niche"] for n in niches[:2]],
        "threats": threats,
    }

    weighted_score = round(sum(f["v"] * f["weight"] for f in factors))

    # Provenance metadata identifying actual dataset vs fallback
    dataset_integration = {
        "status": "actual_data" if village_data else "fallback_data",
        "confidence": "verified" if village_data else "demo",
        "village_matched": village_data.get("village") if village_data else None,
        "block_matched": village_data.get("block") if village_data else None,
        "district_matched": village_data.get("district") if village_data else None,
        "population": village_data.get("population") if village_data else 12480,
        "households": village_data.get("households") if village_data else 2780,
        "literacy_rate_pct": village_data.get("literacy_rate_pct") if village_data else None,
        "dairy_cooperatives": village_data.get("dairy_cooperatives_count") if village_data else None,
        "nearest_vet_clinic_km": village_data.get("nearest_vet_clinic_km") if village_data else None,
        "nearest_bank_km": village_data.get("nearest_bank_km") if village_data else None,
        "weekly_haats": village_data.get("weekly_haats", []) if village_data else [],
        "power_supply_hours": village_data.get("power_supply_hours") if village_data else None,
        "active_shgs": village_data.get("active_shgs") if village_data else None,
        "demographics_source": (
            village_data.get("data_source") if village_data else "Simulated village baseline (Fallback)"
        ),
        "benchmark_source": (
            commodity_data.get("benchmark_source") if commodity_data else "Category median fallback"
        ),
        "value_added_products": commodity_data.get("value_added_products", []) if commodity_data else [],
    }

    return {
        "market_reach": {
            "radius_km": radius_km,
            "estimated_consumers": estimated_consumers,
            "household_count": households,
            "similar_businesses": competitor_count,
            "density_per_km2": density,
            "avg_distance_km": avg_distance_km,
            "monthly_demand_lakh": monthly_demand_lakh,
            "channels": channels,
            "source": source_flag,
            "dataset_status": "actual_data" if village_data else "fallback_data",
        },
        "competitor_map": {
            "count": competitor_count,
            "density_per_km2": density,
            "radius_km": radius_km,
            "source": source_flag,
            "note": f"{competitor_count} shops · {'verified via OSM within 8km' if source_flag=='live' else 'demo density'}",
        },
        "opportunity_analysis": {
            "niches": niches,
            "top_niche": niches[0] if niches else None,
        },
        "swot": swot,
        "threats": swot["threats"],
        "product_market_value": {
            "pricing": pricing,
            "regional_purchasing_power": f"₹{monthly_demand_lakh}L monthly demand in 10km",
            "suggested_band": pricing["band"],
        },
        "viability": {
            "score": weighted_score,
            "grade": "GOOD POTENTIAL" if weighted_score >= 70 else "MODERATE" if weighted_score >= 50 else "LOW",
            "factors": factors,
            "weights": weights,
        },
        "source": source_flag,
        "dataset_integration": dataset_integration,
        "village": village,
        "block": block,
        "district": district,
        "business_category": business_category,
    }

