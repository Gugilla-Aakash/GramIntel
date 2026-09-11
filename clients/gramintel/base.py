import asyncio
import time
from typing import Any, Dict, Optional
import httpx

try:
    from hakiapi import BaseAPIClient as HakiBase  # type: ignore
    HAS_HAKI = True
except Exception:
    HAS_HAKI = False
    HakiBase = object  # type: ignore


class APIError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class BaseAPIClient:
    def __init__(
        self,
        base_url: str = "",
        timeout: float = 10.0,
        max_retries: int = 2,
        headers: Optional[Dict[str, str]] = None,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.headers = headers or {}
        self._transport = transport
        self._circuit_open_until: float = 0
        self._failures = 0

    def _client(self) -> httpx.AsyncClient:
        kwargs: Dict[str, Any] = {"timeout": self.timeout, "headers": self.headers}
        if self._transport:
            kwargs["transport"] = self._transport
        if self.base_url:
            kwargs["base_url"] = self.base_url
        return httpx.AsyncClient(**kwargs)

    def _sync_client(self) -> httpx.Client:
        kwargs: Dict[str, Any] = {"timeout": self.timeout, "headers": self.headers}
        if self._transport:
            kwargs["transport"] = self._transport
        if self.base_url:
            kwargs["base_url"] = self.base_url
        return httpx.Client(**kwargs)

    def _should_retry(self, status: int) -> bool:
        return status in (429, 500, 502, 503, 504)

    def _retry_after(self, response: httpx.Response) -> float:
        try:
            ra = response.headers.get("Retry-After")
            if ra:
                return min(float(ra), 5.0)
        except Exception:
            pass
        return 0.5

    async def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        if time.time() < self._circuit_open_until:
            raise APIError("Circuit breaker open", status_code=503)
        last_exc: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                async with self._client() as client:
                    resp = await client.request(method, url, **kwargs)
                if self._should_retry(resp.status_code) and attempt < self.max_retries:
                    await asyncio.sleep(self._retry_after(resp) * (2**attempt))
                    continue
                if resp.status_code >= 400:
                    if resp.status_code >= 500:
                        self._failures += 1
                        if self._failures >= 3:
                            self._circuit_open_until = time.time() + 30
                    raise APIError(f"HTTP {resp.status_code}: {resp.text[:500]}", status_code=resp.status_code)
                self._failures = 0
                return resp
            except APIError:
                raise
            except Exception as e:
                last_exc = e
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (2**attempt))
                    continue
                self._failures += 1
                if self._failures >= 3:
                    self._circuit_open_until = time.time() + 30
                raise APIError(str(e)) from e
        raise APIError(str(last_exc) if last_exc else "request failed")

    def _request_sync_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        if time.time() < self._circuit_open_until:
            raise APIError("Circuit breaker open", status_code=503)
        last_exc: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                with self._sync_client() as client:
                    resp = client.request(method, url, **kwargs)
                if self._should_retry(resp.status_code) and attempt < self.max_retries:
                    time.sleep(self._retry_after(resp) * (2**attempt))
                    continue
                if resp.status_code >= 400:
                    if resp.status_code >= 500:
                        self._failures += 1
                        if self._failures >= 3:
                            self._circuit_open_until = time.time() + 30
                    raise APIError(f"HTTP {resp.status_code}: {resp.text[:500]}", status_code=resp.status_code)
                self._failures = 0
                return resp
            except APIError:
                raise
            except Exception as e:
                last_exc = e
                if attempt < self.max_retries:
                    time.sleep(0.5 * (2**attempt))
                    continue
                self._failures += 1
                if self._failures >= 3:
                    self._circuit_open_until = time.time() + 30
                raise APIError(str(e)) from e
        raise APIError(str(last_exc) if last_exc else "request failed")
