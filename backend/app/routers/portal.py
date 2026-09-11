from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException
from sqlmodel import Session, select
import json
from typing import Optional, List
from ..db import get_session
from ..deps import require_role
from ..models import User, Case, FeasibilityReport, FinancialPlan, StatusHistory

router = APIRouter(prefix="/portal", tags=["portal"])

@router.get("/cases")
def list_cases(
    status: Optional[str] = Query(None, pattern="^(DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED)$"),
    village: Optional[str] = None,
    category: Optional[str] = None,
    user: User = Depends(require_role("officer")),
    session: Session = Depends(get_session),
):
    q = select(Case)
    if status:
        q = q.where(Case.status == status)
    if village:
        q = q.where(Case.village.contains(village))
    if category:
        q = q.where(Case.business_category.contains(category))
    q = q.order_by(Case.created_at.desc())
    cases = session.exec(q).all()
    result = []
    for c in cases:
        fin = session.exec(select(FinancialPlan).where(FinancialPlan.case_id == c.id)).first()
        result.append({
            "id": c.id,
            "village": c.village,
            "block": c.block,
            "district": c.district,
            "business_category": c.business_category,
            "margin_capital": c.margin_capital,
            "status": c.status,
            "language": c.language,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "project_cost": fin.project_cost if fin else None,
            "scheme": fin.scheme if fin else None,
            "max_loan": fin.max_loan if fin else None,
            "applicant_id": c.applicant_id,
        })
    return {"cases": result, "count": len(result)}
