from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
import json
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ..db import get_session
from ..deps import get_current_user
from ..models import User, Case, FeasibilityReport, FinancialPlan, StatusHistory, Narrative, CaseStatus
from ..schemas import CreateCaseRequest, NarrateRequest
from ..services.workflow import can_transition
from ..services.narrative import generate_narrative
from ..services.narrative import get_groq_client
from ..services.access import can_access_case


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: Optional[List[Dict[str, Any]]] = None
    language: str = "en"

router = APIRouter(prefix="/cases", tags=["cases"])

class ApprovedCaseOut(BaseModel):
    id: int
    village: str
    block: str
    district: str
    business_category: str
    project_cost: int = 0
    scheme: str = ""
    decided_at: datetime

@router.get("/approved", response_model=List[ApprovedCaseOut])
def list_approved_cases(session: Session = Depends(get_session)):
    cases = session.exec(
        select(Case).where(Case.status == CaseStatus.APPROVED).order_by(Case.id.desc()).limit(100)
    ).all()
    out: List[ApprovedCaseOut] = []
    for c in cases:
        fin = session.exec(select(FinancialPlan).where(FinancialPlan.case_id == c.id)).first()
        out.append(ApprovedCaseOut(
            id=c.id, village=c.village, block=c.block, district=c.district,
            business_category=c.business_category,
            project_cost=fin.project_cost if fin else 0,
            scheme=fin.scheme if fin else "",
            decided_at=c.updated_at,
        ))
    return out

@router.post("")
def create_case(payload: CreateCaseRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.role not in ("applicant", "middleman"):
        raise HTTPException(status_code=403, detail="Only applicants can submit cases")
    case_id = payload.case_id
    if case_id is not None:
        case = session.get(Case, case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        if not can_access_case(user, case):
            raise HTTPException(status_code=403, detail="Not your case")
        if case.status != CaseStatus.DRAFT:
            raise HTTPException(status_code=400, detail=f"Cannot submit from status {case.status}")
        if not can_transition(case.status, CaseStatus.SUBMITTED):
            raise HTTPException(status_code=400, detail="Invalid transition")
        prev = case.status
        case.status = CaseStatus.SUBMITTED
        case.updated_at = datetime.utcnow()
        session.add(case)
        note = "Applicant submitted" if user.role == "applicant" else f"Operator {user.email} submitted on behalf of farmer"
        hist = StatusHistory(case_id=case.id, from_status=prev, to_status=CaseStatus.SUBMITTED, actor_user_id=user.id, note=note)
        session.add(hist)
        session.commit()
        session.refresh(case)
        return {"case_id": case.id, "status": case.status, "message": "Case submitted"}
    raise HTTPException(status_code=400, detail="case_id required to submit")

@router.get("/{case_id}")
def get_case(case_id: int, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not can_access_case(user, case):
        raise HTTPException(status_code=403, detail="Not your case")
    feas = session.exec(select(FeasibilityReport).where(FeasibilityReport.case_id == case_id)).first()
    fin = session.exec(select(FinancialPlan).where(FinancialPlan.case_id == case_id)).first()
    narratives = session.exec(select(Narrative).where(Narrative.case_id == case_id)).all()
    history = session.exec(select(StatusHistory).where(StatusHistory.case_id == case_id).order_by(StatusHistory.created_at)).all()
    return {
        "case": case.model_dump(),
        "feasibility_report": json.loads(feas.payload_json) if feas else None,
        "feasibility_source": feas.source if feas else None,
        "financial_plan": {
            "project_cost": fin.project_cost,
            "max_loan": fin.max_loan,
            "scheme": fin.scheme,
            "interest_rate": fin.interest_rate,
            "tenure_months": fin.tenure_months,
            "moratorium_months": fin.moratorium_months,
            "emi_monthly": fin.emi_monthly,
            "emi_quarterly": fin.emi_quarterly,
            "quarterly_schedule": json.loads(fin.quarterly_schedule_json) if fin else [],
            "total_interest": round(fin.emi_monthly * fin.tenure_months - fin.max_loan) if fin and fin.tenure_months else 0,
        } if fin else None,
        "narratives": [{"language": n.language, "model": n.model, "content": json.loads(n.content_json)} for n in narratives],
        "status_history": [h.model_dump() for h in history],
    }

def _build_case_summary(case: Case, feas: Optional[FeasibilityReport], fin: Optional[FinancialPlan]) -> Dict[str, Any]:
    feasibility = json.loads(feas.payload_json) if feas else {}
    financial = None
    if fin:
        total_interest = round(fin.emi_monthly * fin.tenure_months - fin.max_loan) if fin.tenure_months else 0
        financial = {
            "project_cost": fin.project_cost,
            "max_loan": fin.max_loan,
            "scheme": fin.scheme,
            "interest_rate": fin.interest_rate,
            "tenure_months": fin.tenure_months,
            "moratorium_months": fin.moratorium_months,
            "emi_monthly": fin.emi_monthly,
            "emi_quarterly": fin.emi_quarterly,
            "quarterly_schedule": json.loads(fin.quarterly_schedule_json) if fin.quarterly_schedule_json else [],
            "total_interest": total_interest,
        }
    return {
        "business_category": case.business_category,
        "village": case.village,
        "block": case.block,
        "district": case.district,
        "margin_capital": case.margin_capital,
        "financial": financial,
        "feasibility": feasibility,
    }


@router.post("/{case_id}/chat")
def chat_case(case_id: int, payload: ChatRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.role not in ("officer", "applicant", "middleman"):
        raise HTTPException(status_code=403, detail="Officers, applicants and operators can chat")
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not can_access_case(user, case):
        raise HTTPException(status_code=403, detail="Not your case")
    feas = session.exec(select(FeasibilityReport).where(FeasibilityReport.case_id == case_id)).first()
    fin = session.exec(select(FinancialPlan).where(FinancialPlan.case_id == case_id)).first()
    summary = _build_case_summary(case, feas, fin)

    async def event_stream():
        client = get_groq_client()
        async for chunk in client.stream_chat(summary, payload.message, payload.history or [], payload.language):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{case_id}/narrate")
def narrate_case(case_id: int, payload: NarrateRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not can_access_case(user, case):
        raise HTTPException(status_code=403, detail="Not your case")
    fin = session.exec(select(FinancialPlan).where(FinancialPlan.case_id == case_id)).first()
    feas = session.exec(select(FeasibilityReport).where(FeasibilityReport.case_id == case_id)).first()
    if not fin or not feas:
        raise HTTPException(status_code=400, detail="Analysis not found")
    feasibility = json.loads(feas.payload_json)
    buffer = 28000 - fin.emi_monthly if fin.emi_monthly else 13972
    data = generate_narrative(case.business_category, case.village, case.margin_capital, fin.project_cost, fin.max_loan, fin.scheme, payload.language, feasibility, fin.interest_rate, fin.tenure_months, buffer if buffer > 0 else 13972)
    existing = session.exec(select(Narrative).where(Narrative.case_id == case_id, Narrative.language == payload.language)).first()
    if existing:
        existing.content_json = json.dumps(data)
        existing.model = data.get("_model", "template")
        existing.generated_at = datetime.utcnow()
        session.add(existing)
    else:
        nar = Narrative(case_id=case_id, language=payload.language, content_json=json.dumps(data), model=data.get("_model", "template"))
        session.add(nar)
    session.commit()
    return {"case_id": case_id, "language": payload.language, "narrative": data}

@router.post("/{case_id}/decision")
def decide_case(case_id: int, payload: dict, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    from ..schemas import DecisionRequest
    body = DecisionRequest(**payload)
    if user.role != "officer":
        raise HTTPException(status_code=403, detail="Officer only")
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    target = body.decision
    if case.status == CaseStatus.SUBMITTED:
        if not can_transition(case.status, CaseStatus.UNDER_REVIEW):
            raise HTTPException(status_code=400, detail="Invalid transition")
        prev = case.status
        case.status = CaseStatus.UNDER_REVIEW
        case.updated_at = datetime.utcnow()
        session.add(case)
        hist = StatusHistory(case_id=case.id, from_status=prev, to_status=CaseStatus.UNDER_REVIEW, actor_user_id=user.id, note="Moved to review")
        session.add(hist)
        session.commit()
        session.refresh(case)
    if not can_transition(case.status, target):
        raise HTTPException(status_code=400, detail=f"Cannot transition from {case.status} to {target}")
    prev = case.status
    case.status = target
    case.updated_at = datetime.utcnow()
    session.add(case)
    hist = StatusHistory(case_id=case.id, from_status=prev, to_status=target, actor_user_id=user.id, note=body.note)
    session.add(hist)
    session.commit()
    try:
        applicant = session.get(User, case.applicant_id)
        fin = session.exec(select(FinancialPlan).where(FinancialPlan.case_id == case.id)).first()
        feas = session.exec(select(FeasibilityReport).where(FeasibilityReport.case_id == case.id)).first()
        if applicant and applicant.email:
            from ..services.email import send_decision_email
            operator = session.get(User, case.forwarded_by_id) if case.forwarded_by_id else None
            farmer_email = case.farmer_email or applicant.email
            send_decision_email(farmer_email, case, fin, feas, target, body.note or "", user.email, operator.email if operator else None)
    except Exception as e:
        print(f"[Decision Email] failed for case {case.id}: {e}")
    return {"case_id": case.id, "status": case.status, "from": prev, "to": target}
