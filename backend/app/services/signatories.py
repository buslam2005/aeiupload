from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models import AuditRecord, MasterApplicant

ADD_SLOTS = (2, 3, 4, 5)
ALL_SLOTS = (1, 2, 3, 4, 5)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def course_concat(trainingtypecode: str, programmecode: str) -> str:
    return f"{trainingtypecode}{programmecode}"


def populated_slots(applicant: MasterApplicant) -> list[int]:
    return [n for n in ALL_SLOTS if getattr(applicant, f"nmc_course{n}trainingtypecode")]


def first_empty_add_slot(applicant: MasterApplicant) -> int | None:
    """First empty slot among 2-5 - Add Course never touches slot 1, which
    mirrors the top-level course fields set at data creation (see
    developmentplan_AS.md Assumption 2)."""
    for n in ADD_SLOTS:
        if not getattr(applicant, f"nmc_course{n}trainingtypecode"):
            return n
    return None


def register_parts(applicant: MasterApplicant) -> list[str]:
    return [v for v in (applicant.nmc_registerpart1, applicant.nmc_registerpart2, applicant.nmc_registerpart3) if v]


def practice_types(applicant: MasterApplicant) -> list[str]:
    return [v for v in (applicant.nmc_practicetype1, applicant.nmc_practicetype2, applicant.nmc_practicetype3) if v]


def course_already_attained(
    applicant: MasterApplicant,
    trainingtype: str,
    programme: str,
    academicroute: str,
    qualificationlevel: str,
) -> bool:
    """True if the given combo already occupies one of the applicant's
    populated course slots (1-5) - training type, programme, academic level,
    and qualification route all matching."""
    for slot in populated_slots(applicant):
        if (
            getattr(applicant, f"nmc_course{slot}trainingtypecode") == trainingtype
            and getattr(applicant, f"nmc_course{slot}programmecode") == programme
            and getattr(applicant, f"nmc_course{slot}academiclevel") == academicroute
            and getattr(applicant, f"nmc_course{slot}qualificationroute") == qualificationlevel
        ):
            return True
    return False


def add_course(
    session: Session,
    applicant: MasterApplicant,
    trainingtype: str,
    programme: str,
    academicroute: str,
    qualificationlevel: str,
) -> int:
    """Write the chosen combo into the first empty slot (2-5) and append an
    audit row. Returns the slot number. Raises ValueError if the combo is
    already one of the applicant's courses, or if all 5 slots are already
    populated."""
    if course_already_attained(applicant, trainingtype, programme, academicroute, qualificationlevel):
        raise ValueError("The selected course was already attained.")

    slot = first_empty_add_slot(applicant)
    if slot is None:
        raise ValueError("All 5 course slots are already populated")

    setattr(applicant, f"nmc_course{slot}trainingtypecode", trainingtype)
    setattr(applicant, f"nmc_course{slot}programmecode", programme)
    setattr(applicant, f"nmc_course{slot}academiclevel", academicroute)
    setattr(applicant, f"nmc_course{slot}qualificationroute", qualificationlevel)
    session.add(applicant)

    session.add(
        AuditRecord(
            nmc_pin=applicant.nmc_pin,
            nmc_lastname=applicant.nmc_lastname,
            nmc_firstname=applicant.nmc_firstname,
            nmc_regexpirydate=applicant.nmc_regexpirydate,
            nmc_addedby="User1",
            nmc_modifiedon=_now(),
            nmc_attributechanged="Approved Course",
            nmc_previousvalue="",
            nmc_newvalue=course_concat(trainingtype, programme),
        )
    )
    return slot


def remove_course(session: Session, applicant: MasterApplicant, slot: int) -> None:
    """Purge one populated course slot's 4 fields and append an audit row.
    Raises ValueError if the slot isn't populated, or if it's the only
    populated slot left (requirements.md: "if there is just one course left,
    it cannot be removed")."""
    if slot not in ALL_SLOTS:
        raise ValueError(f"Invalid course slot: {slot}")

    populated = populated_slots(applicant)
    if slot not in populated:
        raise ValueError(f"Course slot {slot} is not populated")
    if len(populated) <= 1:
        raise ValueError("Cannot remove the only remaining course")

    trainingtypecode = getattr(applicant, f"nmc_course{slot}trainingtypecode")
    programmecode = getattr(applicant, f"nmc_course{slot}programmecode")
    previous_value = course_concat(trainingtypecode, programmecode)

    for field in ("trainingtypecode", "programmecode", "academiclevel", "qualificationroute"):
        setattr(applicant, f"nmc_course{slot}{field}", None)
    session.add(applicant)

    session.add(
        AuditRecord(
            nmc_pin=applicant.nmc_pin,
            nmc_lastname=applicant.nmc_lastname,
            nmc_firstname=applicant.nmc_firstname,
            nmc_regexpirydate=applicant.nmc_regexpirydate,
            nmc_addedby="User1",
            nmc_modifiedon=_now(),
            nmc_attributechanged="Approved Course",
            nmc_previousvalue=previous_value,
            nmc_newvalue="",
        )
    )


def match_applicant(session: Session, pin: str, lastname: str) -> MasterApplicant | None:
    """Active-only PIN + surname match for the Add a Signatory flow - both
    must agree with the same row, exact match (same convention as the Upload
    module's master-data matching)."""
    return session.exec(
        select(MasterApplicant).where(
            MasterApplicant.nmc_pin == pin,
            MasterApplicant.nmc_lastname == lastname,
            MasterApplicant.nmc_active == "Yes",
        )
    ).first()
