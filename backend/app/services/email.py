import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..config import settings

def _should_send() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASS)

def _send_email(to_email: str, subject: str, text_body: str, html_body: str) -> bool:
    if not _should_send():
        print(f"[Email] (console) to={to_email} subject={subject}\n{text_body[:800]}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        if settings.CUSTOMER_CARE_EMAIL:
            msg["Reply-To"] = settings.CUSTOMER_CARE_EMAIL
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        ctx = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls(context=ctx)
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(msg["From"], to_email, msg.as_string())
        print(f"[Email] sent to {to_email} subject={subject}")
        return True
    except Exception as e:
        print(f"[Email] failed to {to_email}: {type(e).__name__}: {e}")
        print(f"[Email] (console fallback) to={to_email} subject={subject}\n{text_body[:800]}")
        return False

def decision_bodies(case, financial, feasibility, decision: str, note: str, officer_email: str) -> tuple[str, str]:
    village = case.village
    block = case.block
    district = case.district
    category = case.business_category
    margin = case.margin_capital
    lang = case.language
    is_approved = decision == "APPROVED"
    verdict = "Approved" if is_approved else "Rejected"
    color = "#0B5D3B" if is_approved else "#991B1B"
    bg = "#ECFDF5" if is_approved else "#FEF2F2"
    border = "#A7F3D0" if is_approved else "#FECACA"
    emoji = "✓" if is_approved else "✕"
    project = financial.project_cost if financial else "-"
    loan = financial.max_loan if financial else "-"
    scheme = financial.scheme if financial else "-"
    rate = financial.interest_rate if financial else "-"
    tenure = financial.tenure_months if financial else "-"
    moratorium = financial.moratorium_months if financial else "-"
    emi_m = financial.emi_monthly if financial else "-"
    emi_q = financial.emi_quarterly if financial else "-"
    viability = ""
    try:
        import json
        feas = __import__("json").loads(feasibility.payload_json) if feasibility else {}
        v = feas.get("viability", {}) if feas else {}
        viability = f"{v.get('score','-')}/100 {v.get('grade','')}"
    except Exception:
        viability = "-"
    text = f"""GramIntel — Application {verdict}
Case #{case.id} — {village}, {block}, {district}
Business: {category} | Margin: ₹{margin:,} | Project: ₹{project:,} | Loan: ₹{loan:,}
Scheme: {scheme} {rate}% {tenure}mo moratorium {moratorium}mo | EMI ₹{emi_m:,}/mo ₹{emi_q:,}/qtr
Viability: {viability}
Decision: {decision} by {officer_email}
Reason: {note or "(no reason provided)"}
Language: {lang}
Login to view full report: {settings.FRONTEND_URL}/assistant
Questions? Write to customer care: {settings.CUSTOMER_CARE_EMAIL}
"""
    html = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0B5D3B;padding:18px 28px;">
            <span style="color:#fff;font-size:16px;font-weight:700;font-style:italic;">GramIntel</span>
            <span style="color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:.14em;margin-left:8px;">DECISION</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{bg};border:1px solid {border};border-radius:12px;margin-bottom:18px;">
              <tr>
                <td style="padding:16px;width:52px;text-align:center;vertical-align:middle;">
                  <div style="width:36px;height:36px;border-radius:999px;background:{color};color:#ffffff;line-height:36px;text-align:center;font-size:18px;font-weight:700;margin:0 auto;">{emoji}</div>
                </td>
                <td style="padding:16px 16px 16px 0;vertical-align:middle;">
                  <div style="font-size:18px;font-weight:700;color:{color};line-height:1.2;">Application {verdict} — Case #{case.id}</div>
                  <div style="font-size:12px;color:#374151;margin-top:2px;">{village}, {block}, {district} · {category}</div>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 12px;color:#111827;font-size:14px;line-height:1.6;"><strong>Decision:</strong> <span style="color:{color};font-weight:700;">{decision}</span> by {officer_email}</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin:12px 0;">
              <div style="font-size:11px;letter-spacing:.08em;color:#6b7280;margin-bottom:6px;">OFFICER REASON</div>
              <div style="font-size:13px;color:#111827;white-space:pre-wrap;">{note or "(no reason provided)"}</div>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
              <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;color:#6b7280;">BUSINESS</td><td style="padding:10px 14px;font-size:13px;text-align:right;">{category} · Margin ₹{margin:,}</td></tr>
              <tr><td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;color:#6b7280;border-top:1px solid #f3f4f6;">PROJECT / LOAN</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #f3f4f6;">₹{project:,}/ ₹{loan:,}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;color:#6b7280;border-top:1px solid #f3f4f6;">SCHEME</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #f3f4f6;">{scheme} · {rate}% · {tenure}mo + {moratorium}mo moratorium</td></tr>
              <tr><td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;color:#6b7280;border-top:1px solid #f3f4f6;">EMI</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #f3f4f6;">₹{emi_m:,}/mo · ₹{emi_q:,}/qtr</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;color:#6b7280;border-top:1px solid #f3f4f6;">VIABILITY</td><td style="padding:10px 14px;font-size:13px;text-align:right;border-top:1px solid #f3f4f6;">{viability}</td></tr>
            </table>
            <div style="margin-top:18px;text-align:center;">
              <a href="{settings.FRONTEND_URL}/assistant" style="display:inline-block;background:#0B5D3B;color:#fff;text-decoration:none;border-radius:999px;padding:11px 22px;font-size:13px;font-weight:600;">View full report</a>
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;text-align:center;">Case #{case.id} · Language {lang} · Questions? Write to customer care: {settings.CUSTOMER_CARE_EMAIL}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""
    return text, html

def send_decision_email(applicant_email: str, case, financial, feasibility, decision: str, note: str, officer_email: str, operator_email: str | None = None):
    subject = f"GramIntel — Case #{case.id} { 'Approved ✓' if decision=='APPROVED' else 'Rejected' } — {case.village} {case.business_category}"
    text, html = decision_bodies(case, financial, feasibility, decision, note, officer_email)
    recipients = [applicant_email]
    if operator_email and operator_email != applicant_email:
        recipients.append(operator_email)
    ok = True
    for to in recipients:
        ok = _send_email(to, subject, text, html) and ok
    return ok
