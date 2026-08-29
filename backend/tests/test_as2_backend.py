# Phase 2 (Backend Logic) coverage - endpoints in app/routers/signatories.py
# and app/routers/lookups.py's new course-choices endpoint, driven entirely
# through the public API (TestClient), mirroring test_phase3_uploads_api.py's
# style. Fixtures per manual_testing_guideAS.md: 26H0401Z/Young is active with
# only course 1 populated (R/AN1/B Nurs (Hons)/F); 26H0417Z/Young is the same
# course but nmc_active='No'.


def add_course(client, pin, trainingtype, programme, academicroute, qualificationlevel):
    return client.post(
        f"/api/signatories/{pin}/courses",
        json={
            "nmc_trainingtype": trainingtype,
            "nmc_programme": programme,
            "nmc_academicroute": academicroute,
            "nmc_qualificationlevel": qualificationlevel,
        },
    )


# --- Signatories list ---------------------------------------------------


def test_list_active_signatories(client):
    resp = client.get("/api/signatories", params={"active": "Yes"})
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 16
    assert all(r["nmc_active"] == "Yes" for r in rows)


def test_list_inactive_signatories(client):
    resp = client.get("/api/signatories", params={"active": "No"})
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) == 8
    assert all(r["nmc_active"] == "No" for r in rows)


def test_list_signatory_approved_course_title_and_tags(client):
    resp = client.get("/api/signatories", params={"active": "Yes"})
    row = next(r for r in resp.json() if r["nmc_pin"] == "26H0401Z")
    assert row["approved_course_title"] == "RAN1"
    assert row["register_parts"] == ["Nursing", "Nursing", "Nursing"]
    # nmc_practicetype1 was populated (2026-08-29 data update) - mirrors
    # nmc_registerpart1 in the seed data; practicetype2/3 are still blank.
    assert row["practice_types"] == ["Nursing"]


# --- View Details ---------------------------------------------------------


def test_get_signatory_not_found(client):
    resp = client.get("/api/signatories/NOSUCHPIN")
    assert resp.status_code == 404


def test_view_details_has_exactly_one_course_row(client):
    resp = client.get("/api/signatories/26H0401Z")
    assert resp.status_code == 200
    body = resp.json()
    assert body["nmc_institutename"] == "University of Chester"
    assert len(body["courses"]) == 1
    course = body["courses"][0]
    assert course["slot"] == 1
    assert course["nmc_trainingtypecode"] == "R"
    assert course["nmc_programmecode"] == "AN1"
    # Resolved via the programmes join (institute 1315 + R/AN1/B Nurs (Hons)/F),
    # not the applicant's own stored nmc_aeiprogrammetitle - the two sources
    # disagree in the seed data, which is expected (see
    # developmentplan_AS.md's display-time-lookup assumption).
    assert course["nmc_aeiprogrammetitle"] == "BN (Hons) Adult Nursing"


def test_view_details_disambiguates_title_by_qualification_level(client):
    # Institute 1315's SC1/B Nurs (Hons) has two rows differing only by
    # qualification level, with different titles - confirms the course-title
    # join doesn't just match the first one it finds.
    add_course(client, "26H0401Z", "R", "SC1", "B Nurs (Hons)", "A")
    resp = client.get("/api/signatories/26H0401Z")
    apprenticeship_row = next(c for c in resp.json()["courses"] if c["slot"] == 2)
    assert apprenticeship_row["nmc_aeiprogrammetitle"] == "BN (Hons) Children's Nursing Apprenticeship"

    add_course(client, "26H0402Z", "R", "SC1", "B Nurs (Hons)", "F")
    resp2 = client.get("/api/signatories/26H0402Z")
    fulltime_row = next(c for c in resp2.json()["courses"] if c["slot"] == 2)
    assert fulltime_row["nmc_aeiprogrammetitle"] == "BN (Hons) Children's Nursing"


# --- Course Lookup choices --------------------------------------------------


def test_course_choices_scoped_to_institute(client):
    resp = client.get("/api/course-choices", params={"institute_code": "1315"})
    assert resp.status_code == 200
    choices = resp.json()
    assert len(choices) == 8
    assert all(c["nmc_qualificationlevelname"] for c in choices)
    # descriptive text, not the raw code letter
    assert {c["nmc_qualificationlevelname"] for c in choices} <= {"Full Time", "Part Time", "Apprenticeship"}


def test_course_choices_excludes_other_institutes(client):
    resp = client.get("/api/course-choices", params={"institute_code": "8020"})
    codes = {c["nmc_programme"] for c in resp.json()}
    assert "SC1" not in codes


# --- Add Course -------------------------------------------------------------


def test_add_course_fills_first_empty_slot_and_writes_audit(client):
    resp = add_course(client, "26H0401Z", "R", "SC1", "B Nurs (Hons)", "F")
    assert resp.status_code == 200
    courses = resp.json()["courses"]
    assert len(courses) == 2
    assert courses[1]["slot"] == 2
    assert courses[1]["nmc_trainingtypecode"] == "R"
    assert courses[1]["nmc_programmecode"] == "SC1"

    audit = client.get("/api/signatories/26H0401Z/audit").json()
    assert len(audit) == 1
    assert audit[0]["nmc_attributechanged"] == "Approved Course"
    assert audit[0]["nmc_previousvalue"] == ""
    assert audit[0]["nmc_newvalue"] == "RSC1"


def test_add_course_fills_slots_in_order_2_through_5(client):
    for trainingtype, programme, academicroute, qualificationlevel in (
        ("R", "SC1", "B Nurs (Hons)", "A"),
        ("R", "SC1", "B Nurs (Hons)", "F"),
        ("F", "P2", "Level 7", "F"),
        ("F", "P2", "Level 7", "P"),
    ):
        resp = add_course(client, "26H0401Z", trainingtype, programme, academicroute, qualificationlevel)
        assert resp.status_code == 200

    body = client.get("/api/signatories/26H0401Z").json()
    slots = [c["slot"] for c in body["courses"]]
    assert slots == [1, 2, 3, 4, 5]


def test_add_course_rejected_when_all_5_slots_full(client):
    for trainingtype, programme, academicroute, qualificationlevel in (
        ("R", "SC1", "B Nurs (Hons)", "A"),
        ("R", "SC1", "B Nurs (Hons)", "F"),
        ("F", "P2", "Level 7", "F"),
        ("F", "P2", "Level 7", "P"),
    ):
        assert add_course(client, "26H0401Z", trainingtype, programme, academicroute, qualificationlevel).status_code == 200

    resp = add_course(client, "26H0401Z", "S", "DF3", "PG Dip", "F")
    assert resp.status_code == 409

    body = client.get("/api/signatories/26H0401Z").json()
    assert len(body["courses"]) == 5


def test_add_course_rejected_when_identical_to_an_existing_course(client):
    # 26H0401Z's course 1 is R/AN1/B Nurs (Hons)/F - attempting to add that
    # exact combo again must be rejected, distinctly from the capacity error.
    resp = add_course(client, "26H0401Z", "R", "AN1", "B Nurs (Hons)", "F")
    assert resp.status_code == 409
    assert resp.json()["detail"] == "The selected course was already attained."

    body = client.get("/api/signatories/26H0401Z").json()
    assert len(body["courses"]) == 1


def test_add_course_duplicate_check_covers_every_populated_slot_not_just_course_1(client):
    add_course(client, "26H0401Z", "R", "SC1", "B Nurs (Hons)", "F")  # now course 2

    resp = add_course(client, "26H0401Z", "R", "SC1", "B Nurs (Hons)", "F")
    assert resp.status_code == 409
    assert resp.json()["detail"] == "The selected course was already attained."


def test_add_course_unknown_pin_404(client):
    resp = add_course(client, "NOSUCHPIN", "R", "SC1", "B Nurs (Hons)", "F")
    assert resp.status_code == 404


# --- Remove Course -----------------------------------------------------------


def test_remove_course_rejected_when_only_one_left(client):
    resp = client.delete("/api/signatories/26H0402Z/courses/1")
    assert resp.status_code == 409
    body = client.get("/api/signatories/26H0402Z").json()
    assert len(body["courses"]) == 1


def test_remove_course_purges_fields_and_writes_audit(client):
    add_course(client, "26H0401Z", "R", "SC1", "B Nurs (Hons)", "F")

    resp = client.delete("/api/signatories/26H0401Z/courses/2")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["courses"]) == 1
    assert all(c["slot"] != 2 for c in body["courses"])

    audit = client.get("/api/signatories/26H0401Z/audit").json()
    # newest first
    assert audit[0]["nmc_previousvalue"] == "RSC1"
    assert audit[0]["nmc_newvalue"] == ""


# --- Add Signatory match ------------------------------------------------------


def test_match_active_pin_and_surname(client):
    resp = client.post("/api/signatories/match", json={"nmc_pin": "26H0401Z", "nmc_lastname": "Young"})
    assert resp.status_code == 200
    assert resp.json()["nmc_pin"] == "26H0401Z"


def test_match_rejects_inactive_pin_even_with_correct_surname(client):
    resp = client.post("/api/signatories/match", json={"nmc_pin": "26H0417Z", "nmc_lastname": "Young"})
    assert resp.status_code == 404


def test_match_rejects_surname_mismatch(client):
    resp = client.post("/api/signatories/match", json={"nmc_pin": "26H0401Z", "nmc_lastname": "WrongName"})
    assert resp.status_code == 404
