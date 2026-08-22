from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.db import get_session
from app.models import MasterStudent, UploadBatch, UploadStudent
from app.schemas import (
    BatchDetailOut,
    BatchSummaryOut,
    ResubmitFullRequest,
    ResubmitWithProgrammeRequest,
    UploadStudentOut,
)
from app.services.matching import match_student
from app.services.parsing import UnsupportedFileTypeError, parse_upload_file
from app.services.programmes import list_institutes, resolve_programme_name

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _recompute_batch_totals(session: Session, batch: UploadBatch) -> None:
    rows = session.exec(
        select(UploadStudent).where(UploadStudent.upload_batch_id == batch.nmc_uploadbatchid)
    ).all()
    batch.nmc_totalrecords = len(rows)
    batch.nmc_totalsuccessrecords = sum(1 for r in rows if r.nmc_rowstatus == "Success")
    batch.nmc_totalfailedrecords = sum(1 for r in rows if r.nmc_rowstatus == "Failed")
    session.add(batch)


def _match_and_set_status(session: Session, row: UploadStudent) -> None:
    master = session.get(MasterStudent, row.nmc_nmcpin) if row.nmc_nmcpin else None
    status, errors = match_student(row, master)
    row.nmc_rowstatus = status
    row.nmc_rowuploadtime = _now()
    error_fields = [
        "nmc_error1description",
        "nmc_error2description",
        "nmc_error3description",
        "nmc_error4description",
        "nmc_error5description",
    ]
    for i, field in enumerate(error_fields):
        setattr(row, field, errors[i] if i < len(errors) else None)


def _institute_name(session: Session, institute_code: str) -> str | None:
    return dict(list_institutes(session)).get(institute_code)


def _to_out(session: Session, row: UploadStudent) -> UploadStudentOut:
    out = UploadStudentOut.model_validate(row)
    out.nmc_programmename = resolve_programme_name(
        session,
        row.nmc_traininginstitutecode,
        row.nmc_trainingtype,
        row.nmc_programme,
        row.nmc_academicroute,
    )
    return out


def _batch_summary(session: Session, batch: UploadBatch) -> BatchSummaryOut:
    return BatchSummaryOut(
        nmc_uploadbatchid=batch.nmc_uploadbatchid,
        nmc_uploadbatchtime=batch.nmc_uploadbatchtime,
        nmc_uploadby=batch.nmc_uploadby,
        nmc_institutecode=batch.nmc_institutecode,
        institute_name=_institute_name(session, batch.nmc_institutecode),
        nmc_programme=batch.nmc_programme,
        nmc_academicroute=batch.nmc_academicroute,
        nmc_filename=batch.nmc_filename,
        nmc_totalrecords=batch.nmc_totalrecords,
        nmc_totalsuccessrecords=batch.nmc_totalsuccessrecords,
        nmc_totalfailedrecords=batch.nmc_totalfailedrecords,
        status="Failed" if batch.nmc_totalfailedrecords >= 1 else "Processing Complete",
    )


def _batch_detail(session: Session, batch: UploadBatch) -> BatchDetailOut:
    rows = session.exec(
        select(UploadStudent)
        .where(UploadStudent.upload_batch_id == batch.nmc_uploadbatchid)
        .order_by(UploadStudent.nmc_linenumber)
    ).all()
    summary = _batch_summary(session, batch)
    return BatchDetailOut(
        **summary.model_dump(),
        uploaded_records=[_to_out(session, r) for r in rows if r.nmc_rowstatus == "Success"],
        error_records=[_to_out(session, r) for r in rows if r.nmc_rowstatus == "Failed"],
    )


async def _read_upload(file: UploadFile) -> list[dict[str, str | None]]:
    content = await file.read()
    try:
        return parse_upload_file(file.filename or "", content)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/uploads/alternate-path", response_model=BatchDetailOut)
async def upload_alternate_path(
    institute_code: str = Form(...),
    nmc_trainingtype: str = Form(...),
    nmc_programme: str = Form(...),
    nmc_academicroute: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    rows = await _read_upload(file)

    batch = UploadBatch(
        nmc_uploadbatchtime=_now(),
        nmc_uploadby="User1",
        nmc_institutecode=institute_code,
        nmc_programme=nmc_programme,
        nmc_academicroute=nmc_academicroute,
        nmc_filename=file.filename or "",
        nmc_totalrecords=0,
        nmc_totalsuccessrecords=0,
        nmc_totalfailedrecords=0,
    )
    session.add(batch)
    session.commit()
    session.refresh(batch)

    for line_number, row in enumerate(rows, start=2):
        upload_student = UploadStudent(
            upload_batch_id=batch.nmc_uploadbatchid,
            nmc_linenumber=line_number,
            nmc_rowuploadtime=_now(),
            nmc_rowstatus="Failed",
            **{k: v for k, v in row.items() if k not in ("nmc_traininginstitutecode", "nmc_trainingtype", "nmc_programme", "nmc_academicroute")},
            nmc_traininginstitutecode=institute_code,
            nmc_trainingtype=nmc_trainingtype,
            nmc_programme=nmc_programme,
            nmc_academicroute=nmc_academicroute,
        )
        _match_and_set_status(session, upload_student)
        session.add(upload_student)

    _recompute_batch_totals(session, batch)
    session.commit()
    session.refresh(batch)
    return _batch_detail(session, batch)


@router.post("/uploads/original-path", response_model=BatchDetailOut)
async def upload_original_path(
    institute_code: str = Form(...),
    nmc_trainingtype: str | None = Form(None),
    nmc_programme: str | None = Form(None),
    nmc_academicroute: str | None = Form(None),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    rows = await _read_upload(file)

    batch = UploadBatch(
        nmc_uploadbatchtime=_now(),
        nmc_uploadby="User1",
        nmc_institutecode=institute_code,
        nmc_programme=nmc_programme,
        nmc_academicroute=nmc_academicroute,
        nmc_filename=file.filename or "",
        nmc_totalrecords=0,
        nmc_totalsuccessrecords=0,
        nmc_totalfailedrecords=0,
    )
    session.add(batch)
    session.commit()
    session.refresh(batch)

    for line_number, row in enumerate(rows, start=2):
        upload_student = UploadStudent(
            upload_batch_id=batch.nmc_uploadbatchid,
            nmc_linenumber=line_number,
            nmc_rowuploadtime=_now(),
            nmc_rowstatus="Failed",
            **row,
        )
        _match_and_set_status(session, upload_student)
        session.add(upload_student)

    _recompute_batch_totals(session, batch)
    session.commit()
    session.refresh(batch)
    return _batch_detail(session, batch)


@router.get("/batches", response_model=list[BatchSummaryOut])
def list_batches(session: Session = Depends(get_session)):
    batches = session.exec(
        select(UploadBatch).order_by(UploadBatch.nmc_uploadbatchid.desc())
    ).all()
    return [_batch_summary(session, b) for b in batches]


@router.get("/batches/{batch_id}", response_model=BatchDetailOut)
def get_batch(batch_id: int, session: Session = Depends(get_session)):
    batch = session.get(UploadBatch, batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    return _batch_detail(session, batch)


@router.post("/upload-students/resubmit-with-programme", response_model=list[UploadStudentOut])
def resubmit_with_programme(
    body: ResubmitWithProgrammeRequest,
    session: Session = Depends(get_session),
):
    affected_batches: dict[int, UploadBatch] = {}
    updated: list[UploadStudent] = []

    for student_id in body.upload_student_ids:
        row = session.get(UploadStudent, student_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"upload_student {student_id} not found")
        row.nmc_trainingtype = body.nmc_trainingtype
        row.nmc_programme = body.nmc_programme
        row.nmc_academicroute = body.nmc_academicroute
        _match_and_set_status(session, row)
        session.add(row)
        updated.append(row)
        if row.upload_batch_id not in affected_batches:
            batch = session.get(UploadBatch, row.upload_batch_id)
            if batch is not None:
                affected_batches[row.upload_batch_id] = batch

    for batch in affected_batches.values():
        _recompute_batch_totals(session, batch)

    session.commit()
    for row in updated:
        session.refresh(row)
    return [_to_out(session, r) for r in updated]


@router.post("/upload-students/{student_id}/resubmit-full", response_model=UploadStudentOut)
def resubmit_full(
    student_id: int,
    body: ResubmitFullRequest,
    session: Session = Depends(get_session),
):
    row = session.get(UploadStudent, student_id)
    if row is None:
        raise HTTPException(status_code=404, detail="upload_student not found")

    for field, value in body.model_dump().items():
        setattr(row, field, value)

    _match_and_set_status(session, row)
    session.add(row)

    batch = session.get(UploadBatch, row.upload_batch_id)
    if batch is not None:
        _recompute_batch_totals(session, batch)

    session.commit()
    session.refresh(row)
    return _to_out(session, row)


@router.delete("/upload-students/{student_id}", status_code=204)
def delete_upload_student(student_id: int, session: Session = Depends(get_session)):
    row = session.get(UploadStudent, student_id)
    if row is None:
        raise HTTPException(status_code=404, detail="upload_student not found")

    batch = session.get(UploadBatch, row.upload_batch_id)
    session.delete(row)
    session.commit()

    if batch is not None:
        _recompute_batch_totals(session, batch)
        session.commit()
