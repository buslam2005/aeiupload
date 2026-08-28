import pytest
from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine, select

from app.db import _seed_master_applicants
from app.models import AuditRecord, MasterApplicant


@pytest.fixture()
def session():
    # In-memory SQLite, fresh schema per test, with FK enforcement matching
    # the real app engine (see app/db.py).
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


def test_seed_master_applicants_row_count(session):
    _seed_master_applicants(session)
    rows = session.exec(select(MasterApplicant)).all()
    # masterapplicants.csv has 24 data rows.
    assert len(rows) == 24


def test_seed_master_applicants_active_inactive_split(session):
    _seed_master_applicants(session)
    active = session.exec(select(MasterApplicant).where(MasterApplicant.nmc_active == "Yes")).all()
    inactive = session.exec(select(MasterApplicant).where(MasterApplicant.nmc_active == "No")).all()
    assert len(active) == 16
    assert len(inactive) == 8


def test_seed_is_idempotent(session):
    _seed_master_applicants(session)
    _seed_master_applicants(session)
    assert len(session.exec(select(MasterApplicant)).all()) == 24


def test_master_applicant_spot_check_matches_csv(session):
    _seed_master_applicants(session)
    applicant = session.get(MasterApplicant, "26H0401Z")
    assert applicant is not None
    assert applicant.nmc_lastname == "Young"
    assert applicant.nmc_firstname == "Mary 1"
    assert applicant.nmc_regexpirydate == "16/09/2027"
    assert applicant.nmc_addedby == "Rick Flair"
    assert applicant.nmc_createdon == "19/11/2025"
    assert applicant.nmc_institutecode == "1315"
    assert applicant.nmc_institutename == "University of Chester"
    assert applicant.nmc_trainingtypecode == "R"
    assert applicant.nmc_programmecode == "AN1"
    assert applicant.nmc_academiclevel == "B Nurs (Hons)"
    assert applicant.nmc_active == "Yes"


def test_qualification_route_header_typo_is_remapped(session):
    # masterapplicants.csv's header spells this column "mc_qualificationroute"
    # (missing the leading "n") - confirm the seed loader remapped it onto the
    # correctly named nmc_qualificationroute model field, not dropped or left
    # under the misspelled key.
    _seed_master_applicants(session)
    applicant = session.get(MasterApplicant, "26H0401Z")
    assert applicant.nmc_qualificationroute == "F"
    assert not hasattr(applicant, "mc_qualificationroute")


def test_course1_mirrors_top_level_course_fields(session):
    _seed_master_applicants(session)
    applicant = session.get(MasterApplicant, "26H0401Z")
    assert applicant.nmc_course1trainingtypecode == applicant.nmc_trainingtypecode
    assert applicant.nmc_course1programmecode == applicant.nmc_programmecode
    assert applicant.nmc_course1academiclevel == applicant.nmc_academiclevel
    assert applicant.nmc_course1qualificationroute == applicant.nmc_qualificationroute
    # courseX header typo fix applies to every courseX slot, not just the
    # top-level field.
    assert applicant.nmc_course1qualificationroute == "F"


def test_courses_2_to_5_start_blank_in_seed_data(session):
    _seed_master_applicants(session)
    applicant = session.get(MasterApplicant, "26H0401Z")
    for n in (2, 3, 4, 5):
        assert not getattr(applicant, f"nmc_course{n}trainingtypecode")
        assert not getattr(applicant, f"nmc_course{n}programmecode")
        assert not getattr(applicant, f"nmc_course{n}academiclevel")
        assert not getattr(applicant, f"nmc_course{n}qualificationroute")


def test_inactive_applicant_pin_for_add_signatory_mismatch_tests(session):
    # 26H0417Z is used across the AS test suite as the "inactive but otherwise
    # valid PIN/surname" fixture - confirm the seed data still has it inactive.
    _seed_master_applicants(session)
    applicant = session.get(MasterApplicant, "26H0417Z")
    assert applicant is not None
    assert applicant.nmc_lastname == "Young"
    assert applicant.nmc_active == "No"


def test_audit_records_start_empty(session):
    assert session.exec(select(AuditRecord)).all() == []
