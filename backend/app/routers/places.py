from fastapi import APIRouter, HTTPException, Query
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../clients"))
from gramintel.overpass_client import OverpassClient
from ..config import settings

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/nearby")
def places_nearby(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(8000, ge=100, le=20000),
):
    try:
        client = OverpassClient(
            primary=settings.OVERPASS_PRIMARY,
            fallback=settings.OVERPASS_FALLBACK,
            timeout=55.0,
        )
        res = client.fetch_sync(lat, lng, radius_m, query_timeout=45, include_ways=False)
        return {"elements": res["data"].get("elements", []), "source": "live"}
    except Exception:
        raise HTTPException(status_code=503, detail="Overpass unavailable")
