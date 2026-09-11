from typing import Any, Dict, Optional
import httpx
from .base import BaseAPIClient, APIError


class GramIntelAPI(BaseAPIClient):
    def __init__(self, base_url: str = "http://localhost:8000", token: Optional[str] = None, timeout: float = 10.0, transport: Optional[httpx.BaseTransport] = None):
        headers: Dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        super().__init__(base_url=base_url, timeout=timeout, max_retries=2, headers=headers, transport=transport)
        self.token = token

    def set_token(self, token: str):
        self.token = token
        self.headers["Authorization"] = f"Bearer {token}"

    def health(self) -> Dict[str, Any]:
        resp = self._request_sync_with_retry("GET", "/health")
        return resp.json()

    def request_otp(self, email: str, role: str = "applicant") -> Dict[str, Any]:
        resp = self._request_sync_with_retry("POST", "/auth/otp/request", json={"email": email, "role": role})
        return resp.json()

    def verify_otp(self, email: str, code: str) -> Dict[str, Any]:
        resp = self._request_sync_with_retry("POST", "/auth/otp/verify", json={"email": email, "code": code})
        j = resp.json()
        if "access_token" in j:
            self.set_token(j["access_token"])
        return j

    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        resp = self._request_sync_with_retry("POST", "/assistant/analyze", json=payload)
        return resp.json()

    def narrate(self, case_id: int, language: str = "en") -> Dict[str, Any]:
        resp = self._request_sync_with_retry("POST", f"/cases/{case_id}/narrate", json={"language": language})
        return resp.json()

    def create_case(self, case_id: Optional[int] = None) -> Dict[str, Any]:
        if case_id is not None:
            resp = self._request_sync_with_retry("POST", "/cases", json={"case_id": case_id})
        else:
            resp = self._request_sync_with_retry("POST", "/cases", json={})
        return resp.json()

    def get_case(self, case_id: int) -> Dict[str, Any]:
        resp = self._request_sync_with_retry("GET", f"/cases/{case_id}")
        return resp.json()

    def list_my_cases(self) -> Dict[str, Any]:
        resp = self._request_sync_with_retry("GET", "/applicant/me/cases")
        return resp.json()

    def portal_list(self, status: Optional[str] = None) -> Dict[str, Any]:
        url = "/portal/cases"
        if status:
            url += f"?status={status}"
        resp = self._request_sync_with_retry("GET", url)
        return resp.json()

    def decide(self, case_id: int, decision: str, note: str = "") -> Dict[str, Any]:
        resp = self._request_sync_with_retry("POST", f"/cases/{case_id}/decision", json={"decision": decision, "note": note})
        return resp.json()
