from typing import Any, Dict, List, Optional
import httpx
from .base import BaseAPIClient, APIError

OVERPASS_PRIMARY = "https://overpass-api.de/api/interpreter"
OVERPASS_FALLBACK = "https://overpass.kumi.systems/api/interpreter"
OVERPASS_HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "GramIntel/0.1 (rural business advisory demo)",
}


class OverpassClient(BaseAPIClient):
    def __init__(
        self,
        primary: str = OVERPASS_PRIMARY,
        fallback: str = OVERPASS_FALLBACK,
        timeout: float = 6.0,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        super().__init__(base_url=primary, timeout=timeout, max_retries=1, transport=transport)
        self.primary = primary
        self.fallback = fallback

    def _build_query(self, lat: float, lng: float, radius_m: int, query_timeout: int = 12, include_ways: bool = True) -> str:
        way_line = f'  way["name"](around:{radius_m},{lat},{lng});\n' if include_ways else ""
        out_verb = "out center body;" if include_ways else "out body;"
        return f"""
[out:json][timeout:{query_timeout}];
(
  node["name"](around:{radius_m},{lat},{lng});
{way_line}  node["shop"](around:{radius_m},{lat},{lng});
  node["tourism"]["name"](around:{radius_m},{lat},{lng});
  node["historic"]["name"](around:{radius_m},{lat},{lng});
  node["leisure"]["name"](around:{radius_m},{lat},{lng});
  node["amenity"="place_of_worship"]["name"](around:{radius_m},{lat},{lng});
);
{out_verb}
"""

    def fetch_sync(self, lat: float, lng: float, radius_m: int = 8000, query_timeout: int = 12, include_ways: bool = True) -> Dict[str, Any]:
        query = self._build_query(lat, lng, radius_m, query_timeout, include_ways)
        body = {"data": query}
        headers = OVERPASS_HEADERS
        urls = [self.primary, self.fallback]
        last_exc: Optional[Exception] = None
        for url in urls:
            try:
                with httpx.Client(transport=self._transport, timeout=self.timeout) as client:
                    resp = client.post(url, data=body, headers=headers)
                    if resp.status_code == 429 or resp.status_code >= 500:
                        last_exc = APIError(f"Overpass {resp.status_code}", status_code=resp.status_code)
                        continue
                    resp.raise_for_status()
                    return {"data": resp.json(), "source": "live", "url": url}
            except Exception as e:
                last_exc = e
                continue
        raise APIError(str(last_exc) if last_exc else "Overpass failed")

    async def fetch(self, lat: float, lng: float, radius_m: int = 8000) -> Dict[str, Any]:
        query = self._build_query(lat, lng, radius_m)
        body = {"data": query}
        headers = OVERPASS_HEADERS
        urls = [self.primary, self.fallback]
        last_exc: Optional[Exception] = None
        for url in urls:
            try:
                async with httpx.AsyncClient(timeout=self.timeout, transport=self._transport) as client:  # type: ignore
                    resp = await client.post(url, data=body, headers=headers)
                    if resp.status_code == 429 or resp.status_code >= 500:
                        last_exc = APIError(f"Overpass {resp.status_code}", status_code=resp.status_code)
                        continue
                    resp.raise_for_status()
                    return {"data": resp.json(), "source": "live", "url": url}
            except Exception as e:
                last_exc = e
                continue
        raise APIError(str(last_exc) if last_exc else "Overpass failed")

    def count_shops_sync(self, lat: float, lng: float, radius_m: int = 8000) -> Dict[str, Any]:
        try:
            res = self.fetch_sync(lat, lng, radius_m)
            elements = res["data"].get("elements", [])
            count = 0
            for el in elements:
                tags = el.get("tags", {})
                if tags.get("shop") or tags.get("amenity") == "marketplace":
                    count += 1
            return {"count": count, "source": "live", "elements": elements}
        except Exception:
            return {"count": 17, "source": "seeded", "elements": []}
