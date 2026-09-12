from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect, text
from .config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

CASE_EXTRA_COLUMNS = {
    "forwarded_by_id": "INTEGER",
    "farmer_name": "VARCHAR",
    "farmer_phone": "VARCHAR",
    "farmer_email": "VARCHAR",
}

def ensure_case_columns(target_engine=None):
    eng = target_engine or engine
    with eng.begin() as conn:
        existing = {c["name"] for c in inspect(conn).get_columns("cases")}
        for col, ddl in CASE_EXTRA_COLUMNS.items():
            if col not in existing:
                conn.execute(text(f"ALTER TABLE cases ADD COLUMN {col} {ddl}"))
                print(f"[db] migrated cases: added column {col}")

def get_session():
    with Session(engine) as session:
        yield session
