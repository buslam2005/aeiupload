import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from starlette.staticfiles import StaticFiles

from app.db import create_db_and_tables

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "out"
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST_DIR", DEFAULT_FRONTEND_DIST))


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="AEI Student Upload", lifespan=lifespan)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIST, html=True, check_dir=False),
    name="frontend",
)
