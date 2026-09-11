from typing import Dict, List

ALLOWED = {
    "DRAFT": ["SUBMITTED"],
    "SUBMITTED": ["UNDER_REVIEW"],
    "UNDER_REVIEW": ["APPROVED", "REJECTED"],
    "APPROVED": [],
    "REJECTED": [],
}

def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in ALLOWED.get(from_status, [])

def decision_to_status(decision: str) -> str:
    if decision == "APPROVED":
        return "APPROVED"
    if decision == "REJECTED":
        return "REJECTED"
    raise ValueError(f"Unknown decision {decision}")
