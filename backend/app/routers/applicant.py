from fastapi import APIRouter, Depends
from sqlmodel import Session, select
import json
from ..db import get_session
from ..deps import get_current_user
from ..models import User, Case, FinancialPlan

router = APIRouter(prefix="/applicant", tags=["applicant"])

@router.get("/me/cases")
def list_my_cases(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.role != "applicant":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Applicants only")
    cases = session.exec(select(Case).where(Case.applicant_id == user.id).order_by(Case.created_at.desc())).all()
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
        })
    return {"cases": result, "count": len(result)}
