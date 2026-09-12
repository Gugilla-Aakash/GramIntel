from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum

def utcnow():
    return datetime.utcnow()

class UserRole(str, Enum):
    applicant = "applicant"
    officer = "officer"
    middleman = "middleman"

class CaseStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class SchemeType(str, Enum):
    MICRO = "MICRO"
    TERM = "TERM"
    INELIGIBLE = "INELIGIBLE"

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    role: str = Field(default=UserRole.applicant)
    created_at: datetime = Field(default_factory=utcnow)

class Case(SQLModel, table=True):
    __tablename__ = "cases"
    id: Optional[int] = Field(default=None, primary_key=True)
    applicant_id: int = Field(foreign_key="users.id", index=True)
    forwarded_by_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None
    farmer_email: Optional[str] = None
    status: str = Field(default=CaseStatus.DRAFT)
    village: str
    block: str
    district: str
    margin_capital: int
    business_category: str
    language: str = Field(default="en")
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

class FeasibilityReport(SQLModel, table=True):
    __tablename__ = "feasibility_reports"
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int = Field(foreign_key="cases.id", index=True, unique=True)
    payload_json: str = Field(default="{}")
    source: str = Field(default="computed")
    generated_at: datetime = Field(default_factory=utcnow)

class FinancialPlan(SQLModel, table=True):
    __tablename__ = "financial_plans"
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int = Field(foreign_key="cases.id", index=True, unique=True)
    project_cost: int
    max_loan: int
    scheme: str
    interest_rate: float
    tenure_months: int
    moratorium_months: int
    emi_monthly: int
    emi_quarterly: int
    quarterly_schedule_json: str = Field(default="[]")
    generated_at: datetime = Field(default_factory=utcnow)

class StatusHistory(SQLModel, table=True):
    __tablename__ = "status_history"
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int = Field(foreign_key="cases.id", index=True)
    from_status: Optional[str] = None
    to_status: str
    actor_user_id: Optional[int] = None
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)

class Narrative(SQLModel, table=True):
    __tablename__ = "narratives"
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int = Field(foreign_key="cases.id", index=True)
    language: str
    content_json: str
    model: str = Field(default="template")
    generated_at: datetime = Field(default_factory=utcnow)

class OTPStore(SQLModel, table=True):
    __tablename__ = "otp_store"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str
    role: str = Field(default=UserRole.applicant)
    expires_at: datetime
    created_at: datetime = Field(default_factory=utcnow)
