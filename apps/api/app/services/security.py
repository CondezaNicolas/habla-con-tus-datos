from __future__ import annotations

from collections import defaultdict, deque
import re
import threading
import time
import unicodedata

from fastapi import HTTPException


_INJECTION_PATTERNS = (
    re.compile(r"\bignore\s+(all\s+)?(previous|prior|system)\s+instructions?\b", re.IGNORECASE),
    re.compile(r"\b(ignora|omite)\s+(todas?\s+)?(las?\s+)?instrucciones?\b", re.IGNORECASE),
    re.compile(r"\b(reveal|show|repeat|print)\s+(the\s+)?(system\s+)?prompt\b", re.IGNORECASE),
    re.compile(r"\b(muestra|revela|repite|imprime)\s+(el\s+)?prompt\s+(del\s+)?sistema\b", re.IGNORECASE),
    re.compile(r"\b(developer|admin|system)\s+mode\b", re.IGNORECASE),
    re.compile(r"\bmodo\s+(desarrollador|administrador|sistema)\b", re.IGNORECASE),
    re.compile(r"\b(api[_\s-]?key|clave\s+de\s+api|secretos?|credenciales?)\b", re.IGNORECASE),
)


def validate_question(question: str) -> str:
    normalized = unicodedata.normalize("NFKC", question).strip()
    if len(normalized) < 3:
        raise HTTPException(status_code=422, detail="La pregunta es demasiado corta.")
    if any(character == "\x00" or unicodedata.category(character) == "Cf" for character in normalized):
        raise HTTPException(status_code=422, detail="La pregunta contiene caracteres no permitidos.")
    if any(pattern.search(normalized) for pattern in _INJECTION_PATTERNS):
        raise HTTPException(
            status_code=422,
            detail="La pregunta parece contener instrucciones dirigidas al sistema. Reformúlala como una consulta sobre tus datos.",
        )
    return normalized


class InMemoryRateLimiter:
    """Bounded sliding-window limiter for a single API process."""

    def __init__(self, max_keys: int = 10_000) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()
        self._max_keys = max_keys

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()
            if len(events) >= limit:
                retry_after = max(1, int(events[0] + window_seconds - now) + 1)
                raise HTTPException(
                    status_code=429,
                    detail="Se alcanzó el límite temporal de solicitudes. Inténtalo nuevamente más tarde.",
                    headers={"Retry-After": str(retry_after)},
                )
            events.append(now)
            if len(self._events) > self._max_keys:
                self._discard_empty_or_oldest()

    def reset(self) -> None:
        with self._lock:
            self._events.clear()

    def _discard_empty_or_oldest(self) -> None:
        empty = next((candidate for candidate, values in self._events.items() if not values), None)
        self._events.pop(empty if empty is not None else next(iter(self._events)), None)


rate_limiter = InMemoryRateLimiter()
global_budget_limiter = InMemoryRateLimiter(max_keys=10)
