import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.db import _seed_master_applicants, _seed_master_students, _seed_programmes, get_session
from app.main import app


@pytest.fixture()
def client():
    """TestClient wired to a fresh in-memory SQLite database, seeded with the
    real programmes/master_students/master_applicants CSVs, isolated from the
    dev DB file and from other tests.

    StaticPool is required here: a plain "sqlite://" in-memory database only
    lives as long as its one connection. Without StaticPool, each new Session
    opens a fresh connection - and therefore a fresh, empty, table-less
    database - which is invisible to every other connection (including the one
    that created/seeded the schema above).
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        _seed_programmes(session)
        _seed_master_students(session)
        _seed_master_applicants(session)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
