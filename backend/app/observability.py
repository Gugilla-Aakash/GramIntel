from contextlib import contextmanager, nullcontext
from typing import Any, Dict, Iterator, Optional

try:
    from codexray import Tracer, set_default_tracer
    _available = True
except ImportError:
    _available = False

_tracer = None


def init_tracer(service: str, api_url: Optional[str], api_key: Optional[str]):
    global _tracer
    if not _available or not api_url or not api_key:
        return None
    _tracer = Tracer(service=service, api_url=api_url, api_key=api_key)
    set_default_tracer(_tracer)
    return _tracer


@contextmanager
def span(operation: str, service: str, metadata: Optional[Dict[str, Any]] = None) -> Iterator[Any]:
    if _tracer is None:
        with nullcontext():
            yield None
    else:
        with _tracer.span(operation, service=service, metadata=metadata or {}):
            yield None
