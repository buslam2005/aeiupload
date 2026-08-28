import csv
import os
from pathlib import Path

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import AuditRecord, MasterApplicant, MasterStudent, Programme

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "aei_upload.db"
DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
SEED_DATA_DIR = Path(__file__).resolve().parent / "seed_data"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if IS_SQLITE else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

if IS_SQLITE:
    # SQLite ignores foreign key constraints unless explicitly enabled per connection.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def _seed_programmes(session: Session) -> None:
    if session.exec(select(Programme)).first():
        return
    with open(SEED_DATA_DIR / "AEI_programmes.csv", newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            session.add(Programme(**row))
    session.commit()


def _seed_master_students(session: Session) -> None:
    if session.exec(select(MasterStudent)).first():
        return
    with open(SEED_DATA_DIR / "master_students.csv", newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            session.add(MasterStudent(**row))
    session.commit()


# masterapplicants.csv misspells "nmc_qualificationroute" (and its 5 courseX
# variants) as "mc_qualificationroute" - missing the leading "n" - on every
# occurrence, while every other nmc_ column in the file is spelled correctly.
# Remap at load time rather than matching the typo in the model.
_MASTER_APPLICANTS_HEADER_FIXES = {
    "mc_qualificationroute": "nmc_qualificationroute",
    "mc_course1qualificationroute": "nmc_course1qualificationroute",
    "mc_course2qualificationroute": "nmc_course2qualificationroute",
    "mc_course3qualificationroute": "nmc_course3qualificationroute",
    "mc_course4qualificationroute": "nmc_course4qualificationroute",
    "mc_course5qualificationroute": "nmc_course5qualificationroute",
}


def _seed_master_applicants(session: Session) -> None:
    if session.exec(select(MasterApplicant)).first():
        return
    with open(SEED_DATA_DIR / "masterapplicants.csv", newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            row = {_MASTER_APPLICANTS_HEADER_FIXES.get(k, k): v for k, v in row.items()}
            session.add(MasterApplicant(**row))
    session.commit()


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        _seed_programmes(session)
        _seed_master_students(session)
        _seed_master_applicants(session)
        # audit_records starts empty - only populated by Add/Remove Course actions.


def get_session():
    with Session(engine) as session:
        yield session
