import json
import os
import math
from typing import Dict, Any, List, Optional

_DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
_VILLAGES_CACHE: Optional[List[Dict[str, Any]]] = None
_COMMODITIES_CACHE: Optional[Dict[str, Any]] = None
_SCHEMES_CACHE: Optional[List[Dict[str, Any]]] = None


def _load_json(filename: str) -> Any:
    filepath = os.path.join(_DATA_DIR, filename)
    if not os.path.exists(filepath):
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def get_villages_dataset() -> List[Dict[str, Any]]:
    global _VILLAGES_CACHE
    if _VILLAGES_CACHE is None:
        data = _load_json("village_demographics.json")
        _VILLAGES_CACHE = data if isinstance(data, list) else []
    return _VILLAGES_CACHE


def get_commodities_dataset() -> Dict[str, Any]:
    global _COMMODITIES_CACHE
    if _COMMODITIES_CACHE is None:
        data = _load_json("commodity_benchmarks.json")
        _COMMODITIES_CACHE = data if isinstance(data, dict) else {}
    return _COMMODITIES_CACHE


def get_schemes_dataset() -> List[Dict[str, Any]]:
    global _SCHEMES_CACHE
    if _SCHEMES_CACHE is None:
        data = _load_json("schemes_catalog.json")
        _SCHEMES_CACHE = data if isinstance(data, list) else []
    return _SCHEMES_CACHE


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


def _clean_str(s: Optional[str]) -> str:
    if not s:
        return ""
    return s.strip().lower().replace("-", " ").replace("_", " ")


def lookup_village(
    village: Optional[str] = None,
    block: Optional[str] = None,
    district: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance_km: float = 15.0,
) -> Optional[Dict[str, Any]]:
    """
    Looks up a village in the authentic Mission Antyodaya & Census 2011 dataset.
    Prioritizes:
      1. Exact match on village + block + district
      2. Exact match on village name
      3. Substring match on village name
      4. Geographic proximity (within max_distance_km) if coordinates supplied
    Returns None if no verified record found (triggering fallback).
    """
    dataset = get_villages_dataset()
    if not dataset:
        return None

    v_clean = _clean_str(village)
    b_clean = _clean_str(block)
    d_clean = _clean_str(district)

    # 1. Exact match on (village, block, district)
    if v_clean:
        for row in dataset:
            rv = _clean_str(row.get("village"))
            rb = _clean_str(row.get("block"))
            rd = _clean_str(row.get("district"))
            if rv == v_clean and (not b_clean or rb == b_clean) and (not d_clean or rd == d_clean):
                return row

    # 2. Match on village name alone
    if v_clean:
        for row in dataset:
            rv = _clean_str(row.get("village"))
            if rv == v_clean:
                return row

    # 3. Substring / partial match on village name
    if v_clean and len(v_clean) >= 3:
        for row in dataset:
            rv = _clean_str(row.get("village"))
            if v_clean in rv or rv in v_clean:
                return row

    # 4. Proximity match by coordinates (e.g. from GPS / MapLibre)
    if lat is not None and lng is not None:
        best_row = None
        best_dist = float("inf")
        for row in dataset:
            rlat = row.get("lat")
            rlng = row.get("lng")
            if rlat is not None and rlng is not None:
                d = _haversine_km(lat, lng, float(rlat), float(rlng))
                if d < best_dist and d <= max_distance_km:
                    best_dist = d
                    best_row = row
        if best_row:
            return best_row

    return None


_CATEGORY_ALIASES = {
    "dairy": "Dairy",
    "milk": "Dairy",
    "cattle": "Dairy",
    "retail": "Retail",
    "grocery": "Retail",
    "general store": "Retail",
    "kirana": "Kirana",
    "provisions": "Kirana",
    "poultry": "Poultry",
    "chicken": "Poultry",
    "egg": "Poultry",
    "eggs": "Poultry",
    "food": "Food Processing",
    "food processing": "Food Processing",
    "atta": "Food Processing",
    "flour mill": "Food Processing",
    "bakery": "Food Processing",
    "textile": "Textiles",
    "textiles": "Textiles",
    "cloth": "Textiles",
    "handloom": "Textiles",
    "tailor": "Textiles",
    "tailoring": "Textiles",
    "service": "Services",
    "services": "Services",
    "repair": "Services",
    "mechanic": "Services",
    "salon": "Services",
    "animal husbandry": "Animal Husbandry",
    "goat": "Animal Husbandry",
    "goat farming": "Animal Husbandry",
    "sheep": "Animal Husbandry",
    "livestock": "Animal Husbandry",
}


def lookup_commodity_benchmark(category: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves authentic commodity & trade benchmark data from Agmarknet / DAHD.
    Returns None if category unrecognized (triggering fallback).
    """
    dataset = get_commodities_dataset()
    if not dataset:
        return None

    cat_clean = _clean_str(category)
    canonical = _CATEGORY_ALIASES.get(cat_clean)
    if not canonical:
        # Check direct key
        for k in dataset.keys():
            if _clean_str(k) == cat_clean:
                canonical = k
                break

    if canonical and canonical in dataset:
        return dataset[canonical]

    # Substring check
    for alias, canon in _CATEGORY_ALIASES.items():
        if alias in cat_clean or cat_clean in alias:
            if canon in dataset:
                return dataset[canon]

    return None
