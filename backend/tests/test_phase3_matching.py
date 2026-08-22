from app.models import MasterStudent, UploadStudent
from app.services.matching import match_student

MASTER_KWARGS = dict(
    nmc_nmcpin="16H0404E",
    nmc_nmctitlename="Miss",
    nmc_firstname="ROSE 1",
    nmc_maidenname=None,
    nmc_lastname="LEE",
    nmc_dateofbirth="20020524",
    nmc_gender="F",
    nmc_nationalityname="Nigerian",
    nmc_countryofbirthname="Nigeria",
    nmc_email="rose@example.com",
    nmc_addressline1="London Road 1",
    nmc_addressline2="BOLTON",
    nmc_addressline3=None,
    nmc_city="Woodford",
    nmc_postcode="CM168AH",
    nmc_countryname="England",
    nmc_traininginstitutecode="1315",
    nmc_trainingtype="R",
    nmc_programme="SC1",
    nmc_academicroute="B Nurs (Hons)",
    nmc_coursestartdate="20200901",
    nmc_courseenddate="20290901",
    nmc_trainingexampassdate="20260812",
    nmc_trainingstartdate="20220919",
    nmc_trainingcompletiondate="20260812",
)

# The matching fields UploadStudent shares with MasterStudent (everything
# except upload-only bookkeeping columns).
ROW_FIELD_NAMES = [k for k in MASTER_KWARGS]


def make_master(**overrides) -> MasterStudent:
    kwargs = {**MASTER_KWARGS, **overrides}
    return MasterStudent(**kwargs)


def make_row(**overrides) -> UploadStudent:
    kwargs = {**{k: MASTER_KWARGS[k] for k in ROW_FIELD_NAMES}, **overrides}
    return UploadStudent(
        upload_batch_id=1,
        nmc_linenumber=2,
        nmc_rowuploadtime="2026-01-01T00:00:00",
        nmc_rowstatus="Failed",
        **kwargs,
    )


def test_full_match_is_success():
    status, errors = match_student(make_row(), make_master())
    assert status == "Success"
    assert errors == []


def test_pin_not_found_reports_single_error():
    status, errors = match_student(make_row(), None)
    assert status == "Failed"
    assert errors == ["NMC PIN does not match with organization's record."]


def test_programme_mismatch_alone_is_the_only_error():
    row = make_row(nmc_programme="ZZ")
    status, errors = match_student(row, make_master())
    assert status == "Failed"
    assert errors == ["Programme does not match with organization's record."]


def test_institute_only_difference_still_counts_as_programme_mismatch():
    # The Programme check is a combined check across institute/type/programme/route.
    row = make_row(nmc_traininginstitutecode="9999")
    status, errors = match_student(row, make_master())
    assert status == "Failed"
    assert errors == ["Programme does not match with organization's record."]


def test_first_name_mismatch_alone_is_the_only_error():
    row = make_row(nmc_firstname="Wrong")
    status, errors = match_student(row, make_master())
    assert status == "Failed"
    assert errors == ["First name does not match with organization's record."]


def test_last_name_mismatch_alone_is_the_only_error():
    row = make_row(nmc_lastname="Wrong")
    status, errors = match_student(row, make_master())
    assert errors == ["Last name does not match with organization's record."]


def test_date_of_birth_mismatch_alone_is_the_only_error():
    row = make_row(nmc_dateofbirth="19990101")
    status, errors = match_student(row, make_master())
    assert errors == ["Date of birth does not match with organization's record."]


def test_gender_mismatch_alone_is_the_only_error():
    row = make_row(nmc_gender="M")
    status, errors = match_student(row, make_master())
    assert errors == ["Gender does not match with organization's record."]


def test_none_and_empty_string_are_treated_as_equal_blank():
    # master has nmc_maidenname=None; an upload row with "" should not be a
    # false-positive mismatch just because of None-vs-empty-string representation.
    row = make_row(nmc_maidenname="")
    status, errors = match_student(row, make_master())
    assert status == "Success"
    assert errors == []


def test_multiple_mismatches_are_capped_at_five_in_check_order():
    row = make_row(
        nmc_programme="ZZ",  # -> Programme (slot 1)
        nmc_nmctitlename="Mr",  # -> Title (slot 2)
        nmc_firstname="X",  # -> First name (slot 3)
        nmc_maidenname="X",  # -> Maiden name (slot 4)
        nmc_lastname="X",  # -> Last name (slot 5)
        nmc_dateofbirth="19990101",  # would be a 6th mismatch - not reported
        nmc_gender="M",  # would be a 7th mismatch - not reported
    )
    status, errors = match_student(row, make_master())
    assert status == "Failed"
    assert len(errors) == 5
    assert errors == [
        "Programme does not match with organization's record.",
        "Title does not match with organization's record.",
        "First name does not match with organization's record.",
        "Maiden name does not match with organization's record.",
        "Last name does not match with organization's record.",
    ]
