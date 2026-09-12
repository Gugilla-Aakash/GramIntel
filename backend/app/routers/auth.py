from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlmodel import Session, select
from datetime import datetime, timedelta
import secrets
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import urlencode
import httpx
from jose import jwt
from ..db import get_session
from ..models import User, OTPStore, UserRole
from ..schemas import OTPRequest, OTPVerify, TokenResponse
from ..config import settings
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

_oauth_states: dict = {}
_otp_rate: dict = {}


def _admin_emails() -> set:
    raw = settings.ADMIN_EMAILS or ""
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _operator_emails() -> set:
    raw = settings.OPERATOR_EMAILS or ""
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def resolve_role(email: str) -> str:
    lowered = (email or "").strip().lower()
    if lowered in _admin_emails():
        return "officer"
    if lowered in _operator_emails():
        return "middleman"
    return "applicant"


def _generate_code() -> str:
    return f"{secrets.randbelow(900000) + 100000:06d}"


def _otp_email_bodies(code: str, role: str) -> tuple[str, str]:
    expiry = settings.OTP_EXPIRY_MIN
    text = (
        f"Your GramIntel verification code is {code}\n"
        f"Role: {role}\n"
        f"Expires in {expiry} minutes.\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )
    html = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#111827;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">GramIntel</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;color:#111827;font-size:16px;">Your verification code</p>
                <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
                  Signing in as <strong>{role}</strong>. This code expires in {expiry} minutes.
                </p>
                <div style="background:#f4f4f5;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;">{code}</span>
                </div>
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
    return text, html


def _send_email_otp(email: str, code: str, role: str):
    provider = (settings.OTP_PROVIDER or "console").lower()
    if provider == "console" or not settings.SMTP_HOST or not settings.SMTP_USER:
        print(f"[GramIntel OTP] {email} ({role}) code={code} (console)")
        return False
    try:
        text_body, html_body = _otp_email_bodies(code, role)
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = email
        msg["Subject"] = f"Your GramIntel verification code: {code}"
        # Attach plain text first, HTML last — clients render the last part they support (HTML).
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        ctx = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls(context=ctx)
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(msg["From"], email, msg.as_string())
        print(f"[GramIntel OTP] sent via SMTP to {email} ({role})")
        return True
    except Exception as e:
        print(f"[GramIntel OTP] SMTP failed for {email}: {type(e).__name__}: {e}")
        return False


@router.post("/otp/request")
def request_otp(payload: OTPRequest, session: Session = Depends(get_session)):
    now = datetime.utcnow()
    lst = _otp_rate.get(payload.email, [])
    lst = [t for t in lst if now - t < timedelta(minutes=10)]
    if len(lst) >= settings.OTP_RATE_LIMIT:
        raise HTTPException(
            status_code=429, detail=f"Too many OTP requests. Try again in 10 minutes."
        )
    lst.append(now)
    _otp_rate[payload.email] = lst
    code = _generate_code()
    role = resolve_role(payload.email)
    expires = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MIN)
    existing = session.exec(
        select(OTPStore).where(OTPStore.email == payload.email)
    ).first()
    if existing:
        session.delete(existing)
        session.commit()
    rec = OTPStore(
        email=payload.email, code=code, role=role, expires_at=expires
    )
    session.add(rec)
    session.commit()
    sent = _send_email_otp(payload.email, code, role)
    if not sent:
        print(f"[GramIntel OTP] {payload.email} ({role}) code={code}")
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        user = User(email=payload.email, role=role)
        session.add(user)
        session.commit()
    elif user.role != role:
        user.role = role
        session.add(user)
        session.commit()
    return {
        "message": "OTP sent",
        "email": payload.email,
        "role": role,
        "provider": "smtp" if sent else "console",
    }


@router.post("/otp/verify")
def verify_otp(payload: OTPVerify, session: Session = Depends(get_session)):
    rec = session.exec(
        select(OTPStore).where(
            OTPStore.email == payload.email, OTPStore.code == payload.code
        )
    ).first()
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    exp = rec.expires_at
    if exp.tzinfo is not None:
        exp = exp.replace(tzinfo=None)
    if exp < datetime.utcnow():
        session.delete(rec)
        session.commit()
        raise HTTPException(status_code=400, detail="OTP expired")
    role = resolve_role(payload.email)
    session.delete(rec)
    session.commit()
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        user = User(email=payload.email, role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
    elif user.role != role:
        user.role = role
        session.add(user)
        session.commit()
        session.refresh(user)
    exp = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    token = jwt.encode(
        {"sub": user.email, "role": role, "exp": exp},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "email": user.email,
    }


@router.get("/me")
def auth_me(user=Depends(get_current_user)):
    return {"email": user.email, "role": user.role, "id": user.id}


@router.post("/logout")
def logout(user=Depends(get_current_user)):
    return {"message": "Logged out (client should clear token)"}


@router.get("/oauth/google/authorize")
def oauth_google_authorize(role: str = "applicant", redirect: str = None):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET.",
        )
    if role not in ("applicant", "officer", "middleman"):
        role = "applicant"
    state = secrets.token_urlsafe(24)
    _oauth_states[state] = (role, datetime.utcnow() + timedelta(minutes=10), redirect)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
        "include_granted_scopes": "true",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url, status_code=302)


from pydantic import BaseModel


class GoogleIdTokenPayload(BaseModel):
    credential: str
    role: str = "applicant"


@router.post("/oauth/google/id_token")
def oauth_google_id_token(
    payload: GoogleIdTokenPayload, session: Session = Depends(get_session)
):
    if not payload.credential:
        raise HTTPException(status_code=400, detail="Missing credential")
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": payload.credential},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Token verification failed: {resp.text[:300]}",
                )
            info = resp.json()
            email = info.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="No email in token")
            if info.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=400, detail="Token audience mismatch")
            verified = (
                info.get("email_verified", "true") == "true"
                if isinstance(info.get("email_verified"), str)
                else bool(info.get("email_verified", True))
            )
            if not verified:
                raise HTTPException(status_code=400, detail="Email not verified")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {e}")
    user = session.exec(select(User).where(User.email == email)).first()
    role = resolve_role(email)
    if not user:
        user = User(email=email, role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
    elif user.role != role:
        user.role = role
        session.add(user)
        session.commit()
        session.refresh(user)
    exp = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    jwt_token = jwt.encode(
        {"sub": user.email, "role": role, "exp": exp},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "role": role,
        "email": email,
    }


@router.get("/oauth/callback")
def oauth_callback(code: str, state: str, session: Session = Depends(get_session)):
    entry = _oauth_states.pop(state, None)
    if not entry:
        raise HTTPException(
            status_code=400, detail="Invalid or expired OAuth state. Please try again."
        )
    role, exp, redirect = entry
    if exp < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OAuth state expired")
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="OAuth not configured")
    try:
        with httpx.Client(timeout=10) as client:
            token_resp = client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.OAUTH_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if token_resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Token exchange failed: {token_resp.text[:300]}",
                )
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(
                    status_code=400, detail="No access token from Google"
                )
            user_resp = client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if user_resp.status_code != 200:
                raise HTTPException(
                    status_code=400, detail=f"Userinfo failed: {user_resp.text[:300]}"
                )
            info = user_resp.json()
            email = info.get("email")
            if not email:
                raise HTTPException(status_code=400, detail="No email from Google")
            verified = info.get("verified_email", True)
            if not verified:
                raise HTTPException(status_code=400, detail="Email not verified")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {e}")
    user = session.exec(select(User).where(User.email == email)).first()
    role = resolve_role(email)
    if not user:
        user = User(email=email, role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
    elif user.role != role:
        user.role = role
        session.add(user)
        session.commit()
        session.refresh(user)
    exp = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    jwt_token = jwt.encode(
        {"sub": user.email, "role": role, "exp": exp},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    frontend_base = (redirect or settings.FRONTEND_URL).rstrip("/")
    target = (
        f"{frontend_base}/auth/callback?token={jwt_token}&role={role}&email={email}"
    )
    return RedirectResponse(target, status_code=302)
