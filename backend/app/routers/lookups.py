from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db import get_session
from app.schemas import InstituteOut, ProgrammeChoiceOut
from app.services.programmes import list_institutes, list_programme_choices

router = APIRouter()


@router.get("/institutes", response_model=list[InstituteOut])
def get_institutes(session: Session = Depends(get_session)):
    return [InstituteOut(code=code, name=name) for code, name in list_institutes(session)]


@router.get("/programmes", response_model=list[ProgrammeChoiceOut])
def get_programmes(
    institute_code: str = Query(...),
    session: Session = Depends(get_session),
):
    choices = list_programme_choices(session, institute_code)
    return [
        ProgrammeChoiceOut(
            nmc_trainingtype=p.nmc_trainingtype,
            nmc_programme=p.nmc_programme,
            nmc_academicroute=p.nmc_academicroute,
            nmc_programmename=p.nmc_programmename,
        )
        for p in choices
    ]
