from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db import get_session
from app.schemas import CourseChoiceOut, InstituteOut, ProgrammeChoiceOut, ProgrammeTitleChoiceOut
from app.services.programmes import (
    list_course_choices,
    list_institutes,
    list_programme_choices,
    list_programme_titles,
)

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


@router.get("/programme-titles", response_model=list[ProgrammeTitleChoiceOut])
def get_programme_titles(
    institute_code: str = Query(...),
    session: Session = Depends(get_session),
):
    choices = list_programme_titles(session, institute_code)
    return [
        ProgrammeTitleChoiceOut(
            nmc_trainingtype=p.nmc_trainingtype,
            nmc_programme=p.nmc_programme,
            nmc_academicroute=p.nmc_academicroute,
            nmc_qualificationlevel=p.nmc_qualificationlevel,
            nmc_aeiprogrammetitle=p.nmc_aeiprogrammetitle,
        )
        for p in choices
    ]


@router.get("/course-choices", response_model=list[CourseChoiceOut])
def get_course_choices(
    institute_code: str = Query(...),
    session: Session = Depends(get_session),
):
    choices = list_course_choices(session, institute_code)
    return [
        CourseChoiceOut(
            nmc_programmename=p.nmc_programmename,
            nmc_trainingtype=p.nmc_trainingtype,
            nmc_programme=p.nmc_programme,
            nmc_academicroute=p.nmc_academicroute,
            nmc_qualificationlevel=p.nmc_qualificationlevel,
            nmc_qualificationlevelname=p.nmc_qualificationlevelname,
        )
        for p in choices
    ]
