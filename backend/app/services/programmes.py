from sqlmodel import Session, select

from app.models import Programme


def list_institutes(session: Session) -> list[tuple[str, str]]:
    """Distinct (code, name) pairs across all programmes, sorted by name."""
    rows = session.exec(select(Programme)).all()
    seen: dict[str, str] = {}
    for row in rows:
        seen.setdefault(row.nmc_traininginstitutecode, row.nmc_traininginstitutecodename)
    return sorted(seen.items(), key=lambda pair: pair[1])


def list_programme_choices(session: Session, institute_code: str) -> list[Programme]:
    """Distinct programme choices for an institute, collapsing rows that only
    differ by nmc_qualificationlevel - the UI's programme selection concept
    (Upload Programme Selection, Revised Programme) doesn't distinguish by
    qualification level, only by training type + programme + academic route.
    """
    rows = session.exec(
        select(Programme).where(Programme.nmc_traininginstitutecode == institute_code)
    ).all()
    seen: dict[tuple[str, str, str], Programme] = {}
    for row in rows:
        key = (row.nmc_trainingtype, row.nmc_programme, row.nmc_academicroute)
        seen.setdefault(key, row)
    return sorted(seen.values(), key=lambda p: (p.nmc_trainingtype, p.nmc_programme, p.nmc_academicroute))


def list_programme_titles(session: Session, institute_code: str) -> list[Programme]:
    """One entry per distinct nmc_aeiprogrammetitle for an institute - unlike
    list_programme_choices, this does NOT collapse qualification-level variants:
    Upload Programme Selection's HEI Programme drop-down must show each
    qualification level's own title separately (e.g. an Apprenticeship route and
    its Full Time equivalent have different titles even though they share the
    same training type/programme/academic route).
    """
    rows = session.exec(
        select(Programme).where(Programme.nmc_traininginstitutecode == institute_code)
    ).all()
    seen: dict[str, Programme] = {}
    for row in rows:
        seen.setdefault(row.nmc_aeiprogrammetitle, row)
    return sorted(seen.values(), key=lambda p: p.nmc_aeiprogrammetitle)


def list_course_choices(session: Session, institute_code: str) -> list[Programme]:
    """Every programmes row for an institute, one per distinct qualification
    level (unlike list_programme_choices, this does NOT collapse qualification
    levels) - the Course Lookup Records pop-up must offer each qualification
    level as its own selectable row, since Add Course needs it to disambiguate
    AEI Programme Title (see resolve_course_title).
    """
    rows = session.exec(
        select(Programme).where(Programme.nmc_traininginstitutecode == institute_code)
    ).all()
    return sorted(rows, key=lambda p: (p.nmc_trainingtype, p.nmc_programme, p.nmc_qualificationlevel))


def resolve_course_title(
    session: Session,
    institute_code: str,
    trainingtype: str,
    programme: str,
    academicroute: str,
    qualificationlevel: str,
) -> str | None:
    """AEI Programme Title for one master_applicants course slot, resolved at
    display time (see developmentplan_AS.md's course-subgrid assumption).

    Includes qualificationlevel in the match, not just institute/trainingtype/
    programme/academicroute: institute 1315's own seed data has pairs sharing
    the first 3 (e.g. SC1/B Nurs (Hons) has an Apprenticeship and a Full Time
    row) with different nmc_aeiprogrammetitle values, so dropping
    qualificationlevel would make the match ambiguous and pick whichever row
    happens to load first.
    """
    row = session.exec(
        select(Programme).where(
            Programme.nmc_traininginstitutecode == institute_code,
            Programme.nmc_trainingtype == trainingtype,
            Programme.nmc_programme == programme,
            Programme.nmc_academicroute == academicroute,
            Programme.nmc_qualificationlevel == qualificationlevel,
        )
    ).first()
    return row.nmc_aeiprogrammetitle if row else None


def resolve_programme_name(
    session: Session,
    institute_code: str | None,
    trainingtype: str | None,
    programme: str | None,
    academicroute: str | None,
) -> str | None:
    """Best-effort lookup of nmc_programmename for a (institute, trainingtype,
    programme, academicroute) tuple. Returns None if any part is missing/blank
    or no matching programmes row is found (e.g. a genuinely wrong programme on
    a failed upload row).
    """
    if not (institute_code and trainingtype and programme and academicroute):
        return None
    row = session.exec(
        select(Programme).where(
            Programme.nmc_traininginstitutecode == institute_code,
            Programme.nmc_trainingtype == trainingtype,
            Programme.nmc_programme == programme,
            Programme.nmc_academicroute == academicroute,
        )
    ).first()
    return row.nmc_programmename if row else None
