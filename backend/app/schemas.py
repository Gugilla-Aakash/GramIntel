from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class OTPRequest(BaseModel):
    email: str
    role: str = Field(default="applicant", pattern="^(applicant|officer)$")

class OTPVerify(BaseModel):
    email: str
    code: str

class AnalyzeRequest(BaseModel):
    village: str = Field(min_length=1)
    block: str = Field(min_length=1)
    district: str = Field(min_length=1)
    margin_capital: int = Field(gt=0)
    business_category: str = Field(min_length=1)
    language: str = Field(default="en", pattern="^(en|hi|te)$")
    lat: Optional[float] = None
    lng: Optional[float] = None

class NarrateRequest(BaseModel):
    language: str = Field(default="en", pattern="^(en|hi|te)$")

class CreateCaseRequest(BaseModel):
    case_id: Optional[int] = None

class DecisionRequest(BaseModel):
    decision: str = Field(pattern="^(APPROVED|REJECTED)$")
    note: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class HealthResponse(BaseModel):
    status: str
    version: str = "0.1.0"
