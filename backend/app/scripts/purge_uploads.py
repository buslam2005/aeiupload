"""Purges upload history only, leaving reference data untouched.

Deletes every row from `upload_students` and `upload_batches` (the
transactional data created by real uploads/resubmits during a demo), while
leaving `programmes` and `master_students` (the seeded reference data)
exactly as they are. Useful between demo runs when you want a clean Upload
Summary with no leftover batches, without paying the cost of a full
reset-db (which also drops and reseeds the reference tables).

`upload_students` is deleted before `upload_batches` to satisfy the foreign
key from the former to the latter.

Usage (from backend/):
    uv run python -m app.scripts.purge_uploads
"""

from sqlmodel import Session, delete

from app.db import engine
from app.models import UploadBatch, UploadStudent


def main() -> None:
    with Session(engine) as session:
        student_result = session.execute(delete(UploadStudent))
        batch_result = session.execute(delete(UploadBatch))
        session.commit()

    print(f"Deleted {student_result.rowcount} upload_students row(s) and {batch_result.rowcount} upload_batches row(s).")
    print("programmes and master_students were left untouched.")


if __name__ == "__main__":
    main()
