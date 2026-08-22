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
