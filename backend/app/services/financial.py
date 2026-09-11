import math
from typing import Dict, List, Any

MICRO_CAP = 140_000
TERM_CAP = 5_000_000
MICRO_MAX_LOAN = 125_000
TERM_MAX_LOAN = 4_500_000
WC_NOTE = "Planning estimates — confirm with your SCA officer"

def working_capital(project_cost: int) -> Dict[str, Any]:
    monthly_opex_estimate = round(project_cost * 0.04)  # planning estimate, not a bank norm
    working_capital_3mo = monthly_opex_estimate * 3  # planning estimate, not a bank norm
    contingency_10pct = round(project_cost * 0.10)  # planning estimate, not a bank norm
    return {
        "monthly_opex_estimate": monthly_opex_estimate,
        "working_capital_3mo": working_capital_3mo,
        "contingency_10pct": contingency_10pct,
        "note": WC_NOTE,
    }

def calc_emi(principal: int, annual_rate_pct: float, months: int) -> float:
    r = annual_rate_pct / 12 / 100
    if r == 0:
        return principal / months
    f = math.pow(1 + r, months)
    return (principal * r * f) / (f - 1)

def scheme_for_project_cost(project_cost: int) -> Dict[str, Any]:
    if project_cost <= MICRO_CAP:
        return {
            "scheme": "MICRO",
            "interest_rate": 6.5,
            "tenure_months": 36,
            "moratorium_months": 3,
            "max_loan_cap": MICRO_MAX_LOAN,
        }
    elif project_cost <= TERM_CAP:
        return {
            "scheme": "TERM",
            "interest_rate": 8.0,
            "tenure_months": 84,
            "moratorium_months": 6,
            "max_loan_cap": TERM_MAX_LOAN,
        }
    else:
        return {
            "scheme": "INELIGIBLE",
            "interest_rate": 0,
            "tenure_months": 0,
            "moratorium_months": 0,
            "max_loan_cap": 0,
        }

def quarterly_schedule(principal: int, annual_rate_pct: float, tenure_months: int, moratorium_months: int) -> List[Dict[str, Any]]:
    if tenure_months == 0 or principal == 0:
        return []
    monthly_emi = calc_emi(principal, annual_rate_pct, tenure_months)
    monthly_emi_rounded = round(monthly_emi)
    quarterly_emi = monthly_emi_rounded * 3
    r = annual_rate_pct / 12 / 100
    balance = float(principal)
    schedule: List[Dict[str, Any]] = []
    month = 1
    q_num = 1
    while month <= tenure_months:
        q_start = month
        q_end = min(month + 2, tenure_months)
        q_months = q_end - q_start + 1
        if q_end <= moratorium_months:
            interest_q = 0
            for _ in range(q_months):
                interest_q += balance * r
            schedule.append({
                "quarter": q_num,
                "months": f"{q_start}-{q_end}",
                "emi": 0,
                "emi_monthly": 0,
                "principal": 0,
                "interest": round(interest_q),
                "balance": round(balance),
                "moratorium": True,
            })
        elif q_start <= moratorium_months < q_end:
            moratorium_part = moratorium_months - q_start + 1
            repay_part = q_end - moratorium_months
            interest_q = 0
            principal_q = 0
            for m in range(q_start, q_end + 1):
                interest = balance * r
                interest_q += interest
                if m > moratorium_months:
                    princ = monthly_emi - interest
                    if princ > balance:
                        princ = balance
                    principal_q += princ
                    balance -= princ
                    if balance < 0:
                        balance = 0
            emi_q = monthly_emi_rounded * repay_part
            schedule.append({
                "quarter": q_num,
                "months": f"{q_start}-{q_end}",
                "emi": emi_q,
                "emi_monthly": monthly_emi_rounded,
                "principal": round(principal_q),
                "interest": round(interest_q),
                "balance": round(balance),
                "moratorium": False,
            })
        else:
            interest_q = 0
            principal_q = 0
            for _ in range(q_months):
                interest = balance * r
                interest_q += interest
                princ = monthly_emi - interest
                if princ > balance:
                    princ = balance
                principal_q += princ
                balance -= princ
                if balance < 0:
                    balance = 0
            emi_q = quarterly_emi if q_months == 3 else monthly_emi_rounded * q_months
            schedule.append({
                "quarter": q_num,
                "months": f"{q_start}-{q_end}",
                "emi": emi_q,
                "emi_monthly": monthly_emi_rounded,
                "principal": round(principal_q),
                "interest": round(interest_q),
                "balance": round(balance),
                "moratorium": False,
            })
        q_num += 1
        month = q_end + 1
    return schedule

def compute_financial_plan(margin_capital: int) -> Dict[str, Any]:
    project_cost = int(round(margin_capital / 0.10))
    raw_max_loan = int(round(project_cost * 0.90))
    scheme_info = scheme_for_project_cost(project_cost)
    scheme = scheme_info["scheme"]
    if scheme == "INELIGIBLE":
        return {
            "project_cost": project_cost,
            "max_loan": 0,
            "scheme": scheme,
            "interest_rate": 0,
            "tenure_months": 0,
            "moratorium_months": 0,
            "emi_monthly": 0,
            "emi_quarterly": 0,
            "quarterly_schedule": [],
            "working_capital": {
                "monthly_opex_estimate": 0,
                "working_capital_3mo": 0,
                "contingency_10pct": 0,
                "first_year_outlay": 0,
                "note": WC_NOTE,
            },
            "ineligible_reason": f"Project cost ₹{project_cost:,} exceeds ₹{TERM_CAP:,} cap (PS: ≤₹50L)",
        }
    cap = scheme_info["max_loan_cap"]
    max_loan = min(raw_max_loan, cap)
    emi_monthly_float = calc_emi(max_loan, scheme_info["interest_rate"], scheme_info["tenure_months"])
    emi_monthly = round(emi_monthly_float)
    emi_quarterly = emi_monthly * 3
    schedule = quarterly_schedule(max_loan, scheme_info["interest_rate"], scheme_info["tenure_months"], scheme_info["moratorium_months"])
    wc = working_capital(project_cost)
    first_year_outlay = emi_monthly * 12 + wc["working_capital_3mo"] + wc["contingency_10pct"]  # planning estimate, not a bank norm
    return {
        "project_cost": project_cost,
        "max_loan": max_loan,
        "raw_max_loan": raw_max_loan,
        "scheme": scheme,
        "interest_rate": scheme_info["interest_rate"],
        "tenure_months": scheme_info["tenure_months"],
        "moratorium_months": scheme_info["moratorium_months"],
        "emi_monthly": emi_monthly,
        "emi_quarterly": emi_quarterly,
        "quarterly_schedule": schedule,
        "total_interest": round(emi_monthly * scheme_info["tenure_months"] - max_loan),
        "total_payable": round(emi_monthly * scheme_info["tenure_months"]),
        "working_capital": {
            "monthly_opex_estimate": wc["monthly_opex_estimate"],
            "working_capital_3mo": wc["working_capital_3mo"],
            "contingency_10pct": wc["contingency_10pct"],
            "first_year_outlay": first_year_outlay,
            "note": WC_NOTE,
        },
    }
