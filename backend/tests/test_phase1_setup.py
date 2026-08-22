import pytest
from fastapi.testclient import TestClient

from app.db import DEFAULT_DB_PATH
from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_serves_frontend_index_html(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "AEI Student Upload" in response.text


def test_unknown_route_falls_back_to_404_page(client):
    response = client.get("/this-route-does-not-exist")
    assert response.status_code == 404


def test_startup_lifespan_creates_database_file(client):
    # `client` fixture already entered the TestClient context, which runs the
    # lifespan startup hook (app/main.py) that calls create_db_and_tables().
    assert DEFAULT_DB_PATH.exists()
