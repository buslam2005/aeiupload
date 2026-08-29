from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.db import get_session
from app.models import AuditRecord, MasterApplicant
from app.schemas import (
    AddCourseRequest,
    AuditRecordOut,
    CourseRowOut,
    MatchRequest,
    SignatoryDetailOut,
    SignatoryListItemOut,
)
from app.services.programmes import resolve_course_title
from app.services.signatories import (
    add_course,
    course_concat,
    match_applicant,
    populated_slots,
    practice_types,
    register_parts,
    remove_course,
)

router = APIRouter()


def _get_applicant_or_404(session: Session, pin: str) -> MasterApplicant:
    applicant = session.get(MasterApplicant, pin)
    if applicant is None:
        raise HTTPException(status_code=404, detail="Signatory not found")
    return applicant


def _course_row(session: Session, applicant: MasterApplicant, slot: int) -> CourseRowOut:
    trainingtypecode = getattr(applicant, f"nmc_course{slot}trainingtypecode")
    programmecode = getattr(applicant, f"nmc_course{slot}programmecode")
    academiclevel = getattr(applicant, f"nmc_course{slot}academiclevel")
    qualificationroute = getattr(applicant, f"nmc_course{slot}qualificationroute")
    return CourseRowOut(
        slot=slot,
        nmc_trainingtypecode=trainingtypecode,
        nmc_programmecode=programmecode,
        nmc_academiclevel=academiclevel,
        nmc_qualificationroute=qualificationroute,
        nmc_institutename=applicant.nmc_institutename,
        nmc_aeiprogrammetitle=resolve_course_title(
            session,
            applicant.nmc_institutecode,
            trainingtypecode,
            programmecode,
            academiclevel,
            qualificationroute,
        ),
    )


def _to_list_item(applicant: MasterApplicant) -> SignatoryListItemOut:
    return SignatoryListItemOut(
        nmc_pin=applicant.nmc_pin,
        nmc_lastname=applicant.nmc_lastname,
        nmc_firstname=applicant.nmc_firstname,
        approved_course_title=course_concat(applicant.nmc_trainingtypecode, applicant.nmc_programmecode),
        register_parts=register_parts(applicant),
        practice_types=practice_types(applicant),
        nmc_regexpirydate=applicant.nmc_regexpirydate,
        nmc_createdon=applicant.nmc_createdon,
        nmc_addedby=applicant.nmc_addedby,
        nmc_active=applicant.nmc_active,
    )


def _to_detail(session: Session, applicant: MasterApplicant) -> SignatoryDetailOut:
    return SignatoryDetailOut(
        nmc_pin=applicant.nmc_pin,
        nmc_lastname=applicant.nmc_lastname,
        nmc_firstname=applicant.nmc_firstname,
        nmc_regexpirydate=applicant.nmc_regexpirydate,
        nmc_addedby=applicant.nmc_addedby,
        nmc_createdon=applicant.nmc_createdon,
        nmc_institutecode=applicant.nmc_institutecode,
        nmc_institutename=applicant.nmc_institutename,
        nmc_active=applicant.nmc_active,
        register_parts=register_parts(applicant),
        practice_types=practice_types(applicant),
        courses=[_course_row(session, applicant, slot) for slot in populated_slots(applicant)],
    )


@router.get("/signatories", response_model=list[SignatoryListItemOut])
def list_signatories(
    active: str = Query(...),
    session: Session = Depends(get_session),
):
    rows = session.exec(select(MasterApplicant).where(MasterApplicant.nmc_active == active)).all()
    return [_to_list_item(a) for a in rows]


@router.get("/signatories/{pin}", response_model=SignatoryDetailOut)
def get_signatory(pin: str, session: Session = Depends(get_session)):
    applicant = _get_applicant_or_404(session, pin)
    return _to_detail(session, applicant)


@router.get("/signatories/{pin}/audit", response_model=list[AuditRecordOut])
def get_signatory_audit(pin: str, session: Session = Depends(get_session)):
    _get_applicant_or_404(session, pin)
    rows = session.exec(
        select(AuditRecord).where(AuditRecord.nmc_pin == pin).order_by(AuditRecord.nmc_modifiedon.desc())
    ).all()
    return rows


@router.post("/signatories/{pin}/courses", response_model=SignatoryDetailOut)
def post_add_course(pin: str, body: AddCourseRequest, session: Session = Depends(get_session)):
    applicant = _get_applicant_or_404(session, pin)
    try:
        add_course(
            session,
            applicant,
            body.nmc_trainingtype,
            body.nmc_programme,
            body.nmc_academicroute,
            body.nmc_qualificationlevel,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    session.commit()
    session.refresh(applicant)
    return _to_detail(session, applicant)


@router.delete("/signatories/{pin}/courses/{slot}", response_model=SignatoryDetailOut)
def delete_course(pin: str, slot: int, session: Session = Depends(get_session)):
    applicant = _get_applicant_or_404(session, pin)
    try:
        remove_course(session, applicant, slot)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    session.commit()
    session.refresh(applicant)
    return _to_detail(session, applicant)


@router.post("/signatories/match", response_model=SignatoryDetailOut)
def post_match(body: MatchRequest, session: Session = Depends(get_session)):
    applicant = match_applicant(session, body.nmc_pin, body.nmc_lastname)
    if applicant is None:
        raise HTTPException(status_code=404, detail="No matching active signatory found")
    return _to_detail(session, applicant)
