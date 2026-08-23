"""Rebuilds the demo SQLite database from scratch.

Deletes the existing database file (if present), recreates the schema, and
reseeds `programmes`/`master_students` from app/seed_data - the same thing
that happens automatically on a fresh deploy with no database file yet.
`upload_batches`/`upload_students` end up empty, since those are never
seeded (only real uploads populate them).

Usage (from backend/):
    uv run python -m app.scripts.reset_db
"""

from sqlmodel import Session, select

from app.db import DATABASE_URL, DEFAULT_DB_PATH, create_db_and_tables, engine
from app.models import MasterStudent, Programme


def main() -> None:
    if DATABASE_URL != f"sqlite:///{DEFAULT_DB_PATH}":
        raise SystemExit(
            f"DATABASE_URL is set to a non-default value ({DATABASE_URL}) - "
            "refusing to guess how to reset it. Reset that database manually."
        )

    if DEFAULT_DB_PATH.exists():
        DEFAULT_DB_PATH.unlink()
        print(f"Deleted {DEFAULT_DB_PATH}")
    else:
        print(f"No existing database at {DEFAULT_DB_PATH}")

    create_db_and_tables()

    with Session(engine) as session:
        programme_count = len(session.exec(select(Programme)).all())
        student_count = len(session.exec(select(MasterStudent)).all())

    print(f"Recreated schema and reseeded {programme_count} programmes, {student_count} master students.")
    print("upload_batches and upload_students start empty, same as any fresh deploy.")


if __name__ == "__main__":
    main()
