from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./gramintel.db"
    JWT_SECRET: str = "dev-secret-change-in-prod-please-override"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    GROQ_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "groq"
    OTP_TRANSPORT: str = "console"
    OTP_PROVIDER: str = "console"
    OTP_EXPIRY_MIN: int = 10
    OTP_RATE_LIMIT: int = 3
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    ADMIN_EMAILS: str = ""
    OPERATOR_EMAILS: str = "gugillaaakash6@gmail.com"
    CUSTOMER_CARE_EMAIL: str = "gugillaaakash6@gmail.com"
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/auth/oauth/callback"
    FRONTEND_URL: str = "http://localhost:3000"
    ENV: str = "dev"
    OVERPASS_PRIMARY: str = "https://overpass-api.de/api/interpreter"
    OVERPASS_FALLBACK: str = "https://overpass.kumi.systems/api/interpreter"
    API_BASE: str = "http://localhost:8000"
    CORS_ORIGINS: str = ""
    CODEXRAY_URL: Optional[str] = None
    CODEXRAY_API_KEY: Optional[str] = None
    CODEXRAY_SERVICE: str = "gramintel-api"

    class Config:
        env_file = ("backend/.env", ".env", "backend/app/.env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
