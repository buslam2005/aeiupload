from app.models import MasterStudent, UploadStudent

MAX_ERRORS = 5

PROGRAMME_FIELDS = (
    "nmc_traininginstitutecode",
    "nmc_trainingtype",
    "nmc_programme",
    "nmc_academicroute",
)

# Checked in this order, after the combined Programme check. Only the fields
# shown on the View Details page (UI_requirements.md) are compared - fields not
# visible/editable there (e.g. email, country of birth) can't be corrected by the
# user, so flagging them would be a dead end. Capped at MAX_ERRORS total messages
# (the schema only has 5 error-description slots), so any mismatches beyond the
# first 5 (in this order) are not reported individually - the row is still
# Failed either way.
FIELD_CHECKS: list[tuple[str, str]] = [
    ("Title", "nmc_nmctitlename"),
    ("First name", "nmc_firstname"),
    ("Maiden name", "nmc_maidenname"),
    ("Last name", "nmc_lastname"),
    ("Date of birth", "nmc_dateofbirth"),
    ("Gender", "nmc_gender"),
    ("Nationality", "nmc_nationalityname"),
    ("Address line 1", "nmc_addressline1"),
    ("Address line 2", "nmc_addressline2"),
    ("Address line 3", "nmc_addressline3"),
    ("City", "nmc_city"),
    ("Postcode", "nmc_postcode"),
    ("Country", "nmc_countryname"),
    ("Course start date", "nmc_coursestartdate"),
    ("Course end date", "nmc_courseenddate"),
    ("Training examination pass date", "nmc_trainingexampassdate"),
]


def _equal(a: str | None, b: str | None) -> bool:
    return (a or "") == (b or "")


def match_student(upload_row: UploadStudent, master: MasterStudent | None) -> tuple[str, list[str]]:
    """Compare an upload row against its candidate master_students row.

    Returns (status, error_messages): status is "Success" or "Failed";
    error_messages has at most MAX_ERRORS entries, in the order found.
    """
    if master is None:
        return "Failed", ["NMC PIN does not match with organization's record."]

    errors: list[str] = []

    if any(not _equal(getattr(upload_row, f), getattr(master, f)) for f in PROGRAMME_FIELDS):
        errors.append("Programme does not match with organization's record.")

    for label, field in FIELD_CHECKS:
        if len(errors) >= MAX_ERRORS:
            break
        if not _equal(getattr(upload_row, field), getattr(master, field)):
            errors.append(f"{label} does not match with organization's record.")

    return ("Failed", errors[:MAX_ERRORS]) if errors else ("Success", [])
