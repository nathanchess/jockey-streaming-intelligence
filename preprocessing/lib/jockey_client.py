"""TwelveLabs Jockey API client with retry, polling, and fail-fast errors."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Callable

import requests

BASE_URL = "https://api.twelvelabs.io/v1.3"

MAX_RETRIES = 5
INITIAL_BACKOFF_S = 2.0
ASSET_POLL_INTERVAL_S = 5
ITEM_POLL_INTERVAL_S = 10
ASSET_POLL_TIMEOUT_S = 3600
ITEM_POLL_TIMEOUT_S = 14400


class JockeyApiError(Exception):
    """Non-retryable API failure."""

    def __init__(
        self,
        step: str,
        message: str,
        *,
        http_status: int | None = None,
        response_body: Any = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.step = step
        self.http_status = http_status
        self.response_body = response_body
        self.context = context or {}


class JockeyClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self._json_headers = {"x-api-key": api_key, "Content-Type": "application/json"}

    def _should_retry(self, status: int) -> bool:
        return status == 429 or status >= 500

    def _request(
        self,
        method: str,
        path: str,
        *,
        step: str,
        json_body: dict[str, Any] | None = None,
        files: list[tuple[str, Any]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> requests.Response:
        url = f"{BASE_URL}{path}"
        hdrs = headers or (self._json_headers if json_body is not None else {"x-api-key": self.api_key})
        last_exc: Exception | None = None

        for attempt in range(MAX_RETRIES):
            try:
                response = requests.request(
                    method,
                    url,
                    headers=hdrs,
                    json=json_body,
                    files=files,
                    timeout=300,
                )
                if response.ok:
                    return response
                if self._should_retry(response.status_code) and attempt < MAX_RETRIES - 1:
                    time.sleep(INITIAL_BACKOFF_S * (2**attempt))
                    continue
                body: Any
                try:
                    body = response.json()
                except Exception:
                    body = response.text
                raise JockeyApiError(
                    step,
                    f"{method} {path} failed with HTTP {response.status_code}",
                    http_status=response.status_code,
                    response_body=body,
                )
            except requests.RequestException as exc:
                last_exc = exc
                if attempt < MAX_RETRIES - 1:
                    time.sleep(INITIAL_BACKOFF_S * (2**attempt))
                    continue
                raise JockeyApiError(step, f"Network error: {exc}") from exc

        raise JockeyApiError(step, f"Request failed after retries: {last_exc}")

    def upload_asset_direct(self, file_path: str, step: str = "asset_upload") -> dict[str, Any]:
        path = Path(file_path)
        with path.open("rb") as f:
            response = self._request(
                "POST",
                "/assets",
                step=step,
                headers={"x-api-key": self.api_key},
                files=[
                    ("method", (None, "direct")),
                    ("file", (path.name, f, "video/mp4")),
                ],
            )
        return response.json()

    def get_asset(self, asset_id: str) -> dict[str, Any]:
        response = self._request("GET", f"/assets/{asset_id}", step="asset_get")
        return response.json()

    def poll_asset_ready(
        self,
        asset_id: str,
        on_poll: Callable[[str, float], None] | None = None,
    ) -> dict[str, Any]:
        start = time.monotonic()
        while True:
            elapsed = time.monotonic() - start
            if elapsed > ASSET_POLL_TIMEOUT_S:
                raise JockeyApiError(
                    "asset_poll",
                    f"Asset {asset_id} not ready within {ASSET_POLL_TIMEOUT_S}s",
                    context={"twelvelabs_asset_id": asset_id},
                )
            data = self.get_asset(asset_id)
            status = data.get("status")
            if on_poll:
                on_poll(status or "unknown", elapsed)
            if status == "ready":
                return data
            if status == "failed":
                raise JockeyApiError(
                    "asset_poll",
                    f"Asset {asset_id} processing failed",
                    response_body=data,
                    context={"twelvelabs_asset_id": asset_id},
                )
            time.sleep(ASSET_POLL_INTERVAL_S)

    def create_knowledge_store(self, name: str, ingestion_config: dict[str, Any]) -> tuple[dict[str, Any], int]:
        response = self._request(
            "POST",
            "/knowledge-stores",
            step="store_create",
            json_body={"name": name, "ingestion_config": ingestion_config},
        )
        return response.json(), response.status_code

    def add_store_item(self, store_id: str, asset_id: str) -> dict[str, Any]:
        response = self._request(
            "POST",
            f"/knowledge-stores/{store_id}/items",
            step="item_create",
            json_body={"asset_id": asset_id},
        )
        return response.json()

    def get_store_item(self, store_id: str, item_id: str) -> dict[str, Any]:
        response = self._request(
            "GET",
            f"/knowledge-stores/{store_id}/items/{item_id}",
            step="item_get",
        )
        return response.json()

    def poll_item_ready(
        self,
        store_id: str,
        item_id: str,
        on_poll: Callable[[str, float], None] | None = None,
    ) -> dict[str, Any]:
        start = time.monotonic()
        while True:
            elapsed = time.monotonic() - start
            if elapsed > ITEM_POLL_TIMEOUT_S:
                raise JockeyApiError(
                    "item_poll",
                    f"Item {item_id} not ready within {ITEM_POLL_TIMEOUT_S}s",
                    context={"item_id": item_id, "knowledge_store_id": store_id},
                )
            data = self.get_store_item(store_id, item_id)
            status = data.get("status")
            if on_poll:
                on_poll(status or "unknown", elapsed)
            if status == "ready":
                return data
            if status == "failed":
                raise JockeyApiError(
                    "item_poll",
                    f"Item {item_id} indexing failed",
                    response_body=data,
                    context={"item_id": item_id, "knowledge_store_id": store_id},
                )
            time.sleep(ITEM_POLL_INTERVAL_S)
