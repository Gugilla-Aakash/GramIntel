import pytest
from backend.app.services.financial import compute_financial_plan, calc_emi, working_capital, MICRO_CAP, TERM_CAP

def test_golden_margin_1L():
    p = compute_financial_plan(100_000)
    assert p["project_cost"] == 1_000_000
    assert p["max_loan"] == 900_000
    assert p["scheme"] == "TERM"
    assert p["interest_rate"] == 8.0
    assert p["tenure_months"] == 84
    assert p["moratorium_months"] == 6
    assert p["emi_quarterly"] == p["emi_monthly"] * 3
    assert p["emi_monthly"] == 14028
    assert p["emi_quarterly"] == 42084

def test_micro_boundary():
    p_at = compute_financial_plan(14_000)
    assert p_at["project_cost"] == 140_000
    assert p_at["scheme"] == "MICRO"
    assert p_at["interest_rate"] == 6.5
    assert p_at["tenure_months"] == 36
    assert p_at["moratorium_months"] == 3
    assert p_at["max_loan"] == 125_000
    assert p_at["emi_quarterly"] == p_at["emi_monthly"] * 3

def test_term_boundary_plus_one():
    p = compute_financial_plan(14_001)
    assert p["project_cost"] == 140010
    assert p["scheme"] == "TERM"
    assert p["interest_rate"] == 8.0

def test_micro_small_margin():
    p = compute_financial_plan(5_000)
    assert p["project_cost"] == 50_000
    assert p["scheme"] == "MICRO"
    assert p["max_loan"] == 45_000
    assert p["emi_monthly"] > 0
    assert p["quarterly_schedule"][0]["moratorium"] is True
    assert p["quarterly_schedule"][0]["emi"] == 0

def test_ineligible():
    p = compute_financial_plan(600_000)
    assert p["scheme"] == "INELIGIBLE"
    assert p["max_loan"] == 0
    assert p["emi_monthly"] == 0
    assert "ineligible_reason" in p

def test_quarterly_is_monthly_times_three():
    for margin in [10_000, 14_000, 50_000, 100_000, 200_000]:
        p = compute_financial_plan(margin)
        if p["scheme"] == "INELIGIBLE":
            continue
        assert p["emi_quarterly"] == p["emi_monthly"] * 3, f"margin {margin}"

def test_moratorium_months_per_scheme():
    micro = compute_financial_plan(10_000)
    term = compute_financial_plan(100_000)
    assert micro["moratorium_months"] == 3
    assert term["moratorium_months"] == 6

def test_emi_determinism():
    e1 = calc_emi(900000, 8.0, 84)
    e2 = calc_emi(900000, 8.0, 84)
    assert e1 == e2
    assert round(e1) == 14028

def test_scheme_caps():
    micro = compute_financial_plan(14_000)
    assert micro["max_loan"] == 125_000
    term_big = compute_financial_plan(500_000)
    assert term_big["project_cost"] == 5_000_000
    assert term_big["scheme"] == "TERM"
    assert term_big["max_loan"] == 4_500_000

def test_quarterly_schedule_moratorium_flag():
    term = compute_financial_plan(100_000)
    sched = term["quarterly_schedule"]
    assert sched[0]["moratorium"] is True
    assert sched[1]["moratorium"] is True
    assert sched[2]["moratorium"] is False
    assert sched[2]["emi"] == 42084
    micro = compute_financial_plan(10_000)
    msched = micro["quarterly_schedule"]
    assert msched[0]["moratorium"] is True
    assert msched[0]["emi"] == 0

def test_working_capital_golden_1L():
    p = compute_financial_plan(100_000)
    assert p["emi_monthly"] == 14028
    wc = p["working_capital"]
    assert wc["monthly_opex_estimate"] == 40000
    assert wc["working_capital_3mo"] == 120000
    assert wc["contingency_10pct"] == 100000
    assert wc["first_year_outlay"] == 14028 * 12 + 120000 + 100000
    assert wc["note"] == "Planning estimates — confirm with your SCA officer"

def test_working_capital_fn_direct():
    wc = working_capital(1_000_000)
    assert wc["monthly_opex_estimate"] == 40000
    assert wc["working_capital_3mo"] == 120000
    assert wc["contingency_10pct"] == 100000

def test_working_capital_micro_small():
    p = compute_financial_plan(14_000)
    assert p["scheme"] == "MICRO"
    assert p["project_cost"] == 140000
    wc = p["working_capital"]
    assert wc["monthly_opex_estimate"] == 5600
    assert wc["working_capital_3mo"] == 16800
    assert wc["contingency_10pct"] == 14000
    assert wc["first_year_outlay"] == p["emi_monthly"] * 12 + 16800 + 14000

def test_working_capital_ineligible_zeros():
    p = compute_financial_plan(600_000)
    assert p["scheme"] == "INELIGIBLE"
    assert p["project_cost"] == 6_000_000
    wc = p["working_capital"]
    assert wc["monthly_opex_estimate"] == 0
    assert wc["working_capital_3mo"] == 0
    assert wc["contingency_10pct"] == 0
    assert wc["first_year_outlay"] == 0
    assert wc["note"] == "Planning estimates — confirm with your SCA officer"
