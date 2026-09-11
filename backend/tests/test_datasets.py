from backend.app.services.dataset_service import (
    lookup_village,
    lookup_commodity_benchmark,
    get_villages_dataset,
    get_commodities_dataset,
    get_schemes_dataset,
)
from backend.app.services.feasibility import compute_feasibility


def test_villages_dataset_loading():
    villages = get_villages_dataset()
    assert len(villages) >= 10
    names = [v["village"] for v in villages]
    assert "Gandipet" in names
    assert "Shamshabad" in names
    assert "Chevella" in names
    assert "Baramati" in names


def test_village_exact_and_fuzzy_lookup():
    # Exact lookup
    v1 = lookup_village("Gandipet", "Gandipet", "Rangareddy")
    assert v1 is not None
    assert v1["village"] == "Gandipet"
    assert v1["population"] == 11894
    assert v1["households"] == 2780
    assert v1["dairy_cooperatives_count"] == 3

    # Case insensitive
    v2 = lookup_village("gandipet")
    assert v2 is not None
    assert v2["village"] == "Gandipet"

    # Coordinate proximity lookup (around Chevella coordinates 17.30, 78.13)
    v_near = lookup_village(lat=17.31, lng=78.14)
    assert v_near is not None
    assert v_near["village"] == "Chevella"


def test_commodity_benchmark_lookup():
    dairy = lookup_commodity_benchmark("Dairy")
    assert dairy is not None
    assert dairy["category"] == "Dairy"
    assert dairy["retail_modal_price_inr"] == 60
    assert len(dairy["value_added_products"]) >= 3
    assert dairy["value_add_margin_pct"] > 20

    # Aliases
    assert lookup_commodity_benchmark("milk")["category"] == "Dairy"
    assert lookup_commodity_benchmark("kirana")["category"] == "Kirana"
    assert lookup_commodity_benchmark("chicken")["category"] == "Poultry"
    assert lookup_commodity_benchmark("tailoring")["category"] == "Textiles"


def test_schemes_catalog():
    schemes = get_schemes_dataset()
    assert len(schemes) >= 2
    ids = [s["scheme_id"] for s in schemes]
    assert "MICRO_FINANCE" in ids
    assert "TERM_LOAN" in ids


def test_feasibility_integrates_actual_data_for_known_village():
    # Chevella village in Telangana
    res = compute_feasibility("Chevella", "Chevella", "Rangareddy", "Dairy", 100000)
    integration = res.get("dataset_integration")
    assert integration is not None
    assert integration["status"] == "actual_data"
    assert integration["confidence"] == "verified"
    assert integration["village_matched"] == "Chevella"
    assert integration["population"] == 14230
    assert integration["households"] == 3240
    assert integration["dairy_cooperatives"] == 5
    assert integration["active_shgs"] == 65
    assert res["market_reach"]["estimated_consumers"] == 14230
    assert res["market_reach"]["household_count"] == 3240
    # Monthly demand calculated as households * 1650 (typical monthly dairy spend)
    assert res["market_reach"]["monthly_demand_lakh"] == round(3240 * 1650 / 100000, 1)
    assert "Chevella Sunday Cattle & Produce Market" in res["market_reach"]["channels"]


def test_feasibility_fallback_for_unknown_village():
    # Unknown village not in the dataset
    res = compute_feasibility("UnknownNamelessVillage999", "BlockX", "DistY", "Dairy", 100000)
    integration = res.get("dataset_integration")
    assert integration is not None
    assert integration["status"] == "fallback_data"
    assert integration["confidence"] == "demo"
    assert integration["village_matched"] is None
    # Fallback to simulated baseline figures
    assert res["market_reach"]["estimated_consumers"] == 12480
    assert res["market_reach"]["monthly_demand_lakh"] == 8.4
    assert res["competitor_map"]["count"] == 17
