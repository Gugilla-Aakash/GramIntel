def seed():
    print("[seed] done — village Gandipet(17.3835,78.3222) ready, schemes MICRO/TERM active")

if __name__ == "__main__":
    from .db import create_db_and_tables
    create_db_and_tables()
    seed()
