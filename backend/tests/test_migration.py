import sqlite3
from sqlalchemy import create_engine
from backend.app.db import ensure_case_columns

OLD_SCHEMA = """CREATE TABLE cases (id INTEGER PRIMARY KEY, applicant_id INTEGER, status VARCHAR,
village VARCHAR, block VARCHAR, district VARCHAR, margin_capital INTEGER, business_category VARCHAR,
language VARCHAR, created_at DATETIME, updated_at DATETIME)"""

def test_migrates_old_cases_table_without_losing_rows(tmp_path):
    db = str(tmp_path / "old.db")
    con = sqlite3.connect(db)
    con.execute(OLD_SCHEMA)
    con.execute("INSERT INTO cases (applicant_id, status, village, block, district, margin_capital, business_category) VALUES (1,'DRAFT','G','G','H',100000,'Dairy')")
    con.commit()
    con.close()
    eng = create_engine(f"sqlite:///{db}")
    ensure_case_columns(eng)
    con = sqlite3.connect(db)
    cols = [r[1] for r in con.execute("PRAGMA table_info(cases)")]
    for missing in ("forwarded_by_id", "farmer_name", "farmer_phone", "farmer_email"):
        assert missing in cols, missing
    assert con.execute("SELECT COUNT(*) FROM cases").fetchone()[0] == 1
    con.execute("UPDATE cases SET forwarded_by_id=2, farmer_email='f@t.com' WHERE id=1")
    con.commit()
    assert con.execute("SELECT farmer_email FROM cases WHERE id=1").fetchone()[0] == "f@t.com"
    con.close()


def test_migrate_is_idempotent_on_new_schema(tmp_path):
    db = str(tmp_path / "new.db")
    eng = create_engine(f"sqlite:///{db}")
    from backend.app.models import SQLModel
    SQLModel.metadata.create_all(eng)
    ensure_case_columns(eng)
    ensure_case_columns(eng)
    con = sqlite3.connect(db)
    cols = [r[1] for r in con.execute("PRAGMA table_info(cases)")]
    assert cols.count("forwarded_by_id") == 1
    con.close()
