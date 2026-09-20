from typing import Dict, Any
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../clients"))

from gramintel.groq_client import GroqClient
from ..observability import span as cx_span

def get_groq_client() -> GroqClient:
    from ..config import settings
    return GroqClient(api_key=settings.GROQ_API_KEY)

def generate_narrative(
    business_category: str,
    village: str,
    margin: int,
    project_cost: int,
    loan: int,
    scheme: str,
    language: str,
    signals: Dict[str, Any],
    interest_rate: float = 8.0,
    tenure_months: int = 84,
    buffer: int = 0,
) -> Dict[str, Any]:
    client = get_groq_client()
    years = max(1, tenure_months // 12)
    with cx_span("groq chat", service="groq", metadata={"language": language, "scheme": scheme}):
        return client.generate_sync(
            business_category=business_category,
            village=village,
            margin=margin,
            project_cost=project_cost,
            loan=loan,
            scheme=scheme,
            language=language,
            signals=signals,
            interest_rate=interest_rate,
            tenure_years=years,
            buffer=buffer,
        )
