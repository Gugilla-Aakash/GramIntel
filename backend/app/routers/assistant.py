from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import json
from datetime import datetime
from ..db import get_session
from ..deps import get_current_user
from ..models import User, Case, FeasibilityReport, FinancialPlan, StatusHistory, Narrative, CaseStatus
from ..schemas import AnalyzeRequest, NarrateRequest
from ..services.financial import compute_financial_plan
from ..services.feasibility import compute_feasibility
from ..services.narrative import generate_narrative

router = APIRouter(prefix="/assistant", tags=["assistant"])

@router.post("/analyze")
def analyze(payload: AnalyzeRequest, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if user.role not in ("applicant", "officer", "middleman"):
        raise HTTPException(status_code=403, detail="Only applicants can analyze")
    financial = compute_financial_plan(payload.margin_capital)

    osm_result = None
    try:
        from ..config import settings
        import sys, os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../clients"))
        from gramintel.overpass_client import OverpassClient
        lat = payload.lat if payload.lat is not None else 17.3835
        lng = payload.lng if payload.lng is not None else 78.3222
        client = OverpassClient(primary=settings.OVERPASS_PRIMARY, fallback=settings.OVERPASS_FALLBACK, timeout=25.0)
        osm_result = client.count_shops_sync(lat, lng, 8000)
    except Exception:
        osm_result = {"count": 17, "source": "seeded"}

    feasibility = compute_feasibility(
        village=payload.village,
        block=payload.block,
        district=payload.district,
        business_category=payload.business_category,
        margin_capital=payload.margin_capital,
        osm_result=osm_result,
        lat=payload.lat,
        lng=payload.lng,
    )

    applicant_id = user.id
    forwarded_by_id = None
    farmer_name = None
    farmer_phone = None
    farmer_email = None
    if user.role == "middleman":
        if not payload.farmer_email:
            raise HTTPException(status_code=400, detail="farmer_email required for operator filing")
        farmer = session.exec(select(User).where(User.email == payload.farmer_email)).first()
        if not farmer:
            farmer = User(email=payload.farmer_email, role="applicant")
            session.add(farmer)
            session.commit()
            session.refresh(farmer)
        applicant_id = farmer.id
        forwarded_by_id = user.id
        farmer_name = payload.farmer_name
        farmer_phone = payload.farmer_phone
        farmer_email = payload.farmer_email

    case = Case(
        applicant_id=applicant_id,
        forwarded_by_id=forwarded_by_id,
        farmer_name=farmer_name,
        farmer_phone=farmer_phone,
        farmer_email=farmer_email,
        status=CaseStatus.DRAFT,
        village=payload.village,
        block=payload.block,
        district=payload.district,
        margin_capital=payload.margin_capital,
        business_category=payload.business_category,
        language=payload.language,
    )
    session.add(case)
    session.commit()
    session.refresh(case)

    hist = StatusHistory(case_id=case.id, from_status=None, to_status=CaseStatus.DRAFT, actor_user_id=user.id, note="Created via analyze")
    session.add(hist)

    feas_rec = FeasibilityReport(case_id=case.id, payload_json=json.dumps(feasibility), source=feasibility.get("source", "seeded"))
    session.add(feas_rec)

    fin_rec = FinancialPlan(
        case_id=case.id,
        project_cost=financial["project_cost"],
        max_loan=financial["max_loan"],
        scheme=financial["scheme"],
        interest_rate=financial["interest_rate"],
        tenure_months=financial["tenure_months"],
        moratorium_months=financial["moratorium_months"],
        emi_monthly=financial["emi_monthly"],
        emi_quarterly=financial["emi_quarterly"],
        quarterly_schedule_json=json.dumps(financial.get("quarterly_schedule", [])),
    )
    session.add(fin_rec)
    session.commit()

    narrative_data = None
    try:
        buffer = 85000 - 57000 - financial["emi_monthly"] if financial["emi_monthly"] else 28000 - 14028
        narrative_data = generate_narrative(
            business_category=payload.business_category,
            village=payload.village,
            margin=payload.margin_capital,
            project_cost=financial["project_cost"],
            loan=financial["max_loan"],
            scheme=financial["scheme"],
            language=payload.language,
            signals=feasibility,
            interest_rate=financial["interest_rate"],
            tenure_months=financial["tenure_months"],
            buffer=buffer if buffer > 0 else 13972,
        )
        nar = Narrative(case_id=case.id, language=payload.language, content_json=json.dumps(narrative_data), model=narrative_data.get("_model", "template"))
        session.add(nar)
        session.commit()
    except Exception:
        narrative_data = None

    return {
        "case_id": case.id,
        "feasibility_report": feasibility,
        "financial_plan": financial,
        "narrative": narrative_data,
        "source": feasibility.get("source"),
        "case_status": case.status,
    }


@router.get("/datasets/villages")
def get_verified_villages():
    from ..services.dataset_service import get_villages_dataset
    villages = get_villages_dataset()
    return {
        "count": len(villages),
        "villages": villages,
        "source": "Census 2011 PCA & Mission Antyodaya 2020 (MoRD)",
    }


@router.get("/datasets/benchmarks")
def get_commodity_benchmarks():
    from ..services.dataset_service import get_commodities_dataset
    return {
        "benchmarks": get_commodities_dataset(),
        "source": "Agmarknet (DMI, MoAFW) & DAHD Livestock Benchmarks",
    }


@router.get("/datasets/schemes")
def get_schemes_catalog():
    from ..services.dataset_service import get_schemes_dataset
    return {
        "schemes": get_schemes_dataset(),
        "source": "Ministry of Social Justice & Empowerment (MoSJE)",
    }



