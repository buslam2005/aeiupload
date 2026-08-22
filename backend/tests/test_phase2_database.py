from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, create_engine, select

from app.db import _seed_master_students, _seed_programmes
from app.models import MasterStudent, Programme, UploadBatch, UploadStudent


@pytest.fixture()
def session():
    # In-memory SQLite, fresh schema per test, with FK enforcement matching
    # the real app engine (see app/db.py).
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


def test_seed_programmes_row_count(session):
    _seed_programmes(session)
    rows = session.exec(select(Programme)).all()
    # AEI_programmes.csv has 14 data rows (verified with csv.DictReader; naive
    # `wc -l` undercounts to 13 because the file has no trailing newline after
    # the last row).
    assert len(rows) == 14


def test_seed_master_students_row_count(session):
    _seed_master_students(session)
    rows = session.exec(select(MasterStudent)).all()
    # master_students.csv has 252 data rows (same trailing-newline caveat as
    # above; naive `wc -l` undercounts to 251).
    assert len(rows) == 252


def test_seed_is_idempotent(session):
    _seed_programmes(session)
    _seed_master_students(session)
    _seed_programmes(session)
    _seed_master_students(session)
    assert len(session.exec(select(Programme)).all()) == 14
    assert len(session.exec(select(MasterStudent)).all()) == 252


def test_programme_spot_check_matches_csv(session):
    _seed_programmes(session)
    sc1_rows = session.exec(select(Programme).where(Programme.nmc_programme == "SC1")).all()
    quali_levels = {row.nmc_qualificationlevel for row in sc1_rows}
    assert quali_levels == {"A", "F"}
    for row in sc1_rows:
        assert row.nmc_traininginstitutecode == "1315"
        assert row.nmc_traininginstitutecodename == "University of Chester"
        assert row.nmc_academicroute == "B Nurs (Hons)"


def test_no_programme_rows_have_blank_institute_code(session):
    # Regression guard: 2 rows in AEI_programmes.csv used to have a blank
    # nmc_traininginstitutecode despite a populated institute name - fixed in the
    # source CSV. All 14 rows must now carry a real institute code.
    _seed_programmes(session)
    rows = session.exec(select(Programme)).all()
    assert len(rows) == 14
    assert all(row.nmc_traininginstitutecode for row in rows)


def test_no_programme_training_type_has_trailing_whitespace(session):
    # Regression guard: several rows (P2, DF3, one institute-8020 "1" row) used
    # to store nmc_trainingtype with trailing whitespace padding (e.g.
    # 'F         ', 'S         ', 'G         ') - fixed in the source CSV across
    # all rows, not just P2.
    _seed_programmes(session)
    rows = session.exec(select(Programme)).all()
    assert len(rows) == 14
    for row in rows:
        assert row.nmc_trainingtype == row.nmc_trainingtype.strip()

    # Both P2 rows share training type "F" (Prescribing); they differ by
    # nmc_qualificationlevel ("F" Full Time vs "P" Part Time), not by training type.
    p2_rows = [row for row in rows if row.nmc_programme == "P2"]
    assert len(p2_rows) == 2
    assert {row.nmc_qualificationlevel for row in p2_rows} == {"F", "P"}
    for row in p2_rows:
        assert row.nmc_trainingtype == "F"


def test_master_student_spot_check_matches_csv(session):
    _seed_master_students(session)
    student = session.get(MasterStudent, "16H0404E")
    assert student is not None
    assert student.nmc_firstname == "ROSE 1"
    assert student.nmc_lastname == "LEE"
    assert student.nmc_traininginstitutecode == "1315"
    assert student.nmc_dateofbirth == "20020524"
    assert not hasattr(student, "nmc_institutecode")


def test_upload_batches_and_upload_students_start_empty(session):
    assert session.exec(select(UploadBatch)).all() == []
    assert session.exec(select(UploadStudent)).all() == []


def test_upload_batch_running_number_pk_autoincrements(session):
    batch1 = UploadBatch(
        nmc_uploadbatchtime=datetime.now(timezone.utc).isoformat(),
        nmc_uploadby="User1",
        nmc_institutecode="1315",
        nmc_filename="a.csv",
        nmc_totalrecords=0,
        nmc_totalsuccessrecords=0,
        nmc_totalfailedrecords=0,
    )
    batch2 = UploadBatch(
        nmc_uploadbatchtime=datetime.now(timezone.utc).isoformat(),
        nmc_uploadby="User1",
        nmc_institutecode="1315",
        nmc_filename="b.csv",
        nmc_totalrecords=0,
        nmc_totalsuccessrecords=0,
        nmc_totalfailedrecords=0,
    )
    session.add(batch1)
    session.add(batch2)
    session.commit()
    session.refresh(batch1)
    session.refresh(batch2)
    assert batch2.nmc_uploadbatchid == batch1.nmc_uploadbatchid + 1


def test_upload_student_links_to_its_batch(session):
    batch = UploadBatch(
        nmc_uploadbatchtime=datetime.now(timezone.utc).isoformat(),
        nmc_uploadby="User1",
        nmc_institutecode="1315",
        nmc_programme="SC1",
        nmc_academicroute="B Nurs (Hons)",
        nmc_filename="test.csv",
        nmc_totalrecords=1,
        nmc_totalsuccessrecords=0,
        nmc_totalfailedrecords=1,
    )
    session.add(batch)
    session.commit()
    session.refresh(batch)

    student = UploadStudent(
        upload_batch_id=batch.nmc_uploadbatchid,
        nmc_linenumber=1,
        nmc_nmcpin="16H0404E",
        nmc_firstname="Wrong Name",
        nmc_rowuploadtime=datetime.now(timezone.utc).isoformat(),
        nmc_rowstatus="Failed",
        nmc_error1description="First name does not match with organization's record.",
    )
    session.add(student)
    session.commit()

    rows = session.exec(
        select(UploadStudent).where(UploadStudent.upload_batch_id == batch.nmc_uploadbatchid)
    ).all()
    assert len(rows) == 1
    assert rows[0].nmc_error1description == "First name does not match with organization's record."


def test_upload_student_rejects_unknown_batch_id(session):
    orphan = UploadStudent(
        upload_batch_id=99999,
        nmc_linenumber=1,
        nmc_rowuploadtime=datetime.now(timezone.utc).isoformat(),
        nmc_rowstatus="Failed",
    )
    session.add(orphan)
    with pytest.raises(IntegrityError):
        session.commit()
