from tests.test_phase3_uploads_api import ROSE1_ROW, csv_bytes, upload_alternate

# --- Programme titles (HEI Programme drop-down, distinct nmc_aeiprogrammetitle) ---


def test_list_programme_titles_for_institute(client):
    resp = client.get("/api/programme-titles", params={"institute_code": "1315"})
    assert resp.status_code == 200
    choices = resp.json()
    # 8 distinct nmc_aeiprogrammetitle values for institute 1315 - qualification
    # level variants (e.g. SC1's Apprenticeship vs Full Time) are NOT collapsed,
    # unlike /api/programmes.
    assert len(choices) == 8
    titles = {c["nmc_aeiprogrammetitle"] for c in choices}
    assert "BN (Hons) Children's Nursing Apprenticeship" in titles
    assert "BN (Hons) Children's Nursing" in titles


def test_list_programme_titles_excludes_other_institutes(client):
    resp = client.get("/api/programme-titles", params={"institute_code": "8020"})
    titles = {c["nmc_aeiprogrammetitle"] for c in resp.json()}
    assert "BN (Hons) Children's Nursing" not in titles


def test_list_programme_titles_sorted_alphabetically(client):
    resp = client.get("/api/programme-titles", params={"institute_code": "1315"})
    titles = [c["nmc_aeiprogrammetitle"] for c in resp.json()]
    assert titles == sorted(titles)


# --- Single upload_student fetch (View Details page load) -------------------------


def test_get_upload_student_returns_row_with_resolved_programme_name(client):
    batch = upload_alternate(client, csv_bytes(ROSE1_ROW)).json()
    row_id = batch["uploaded_records"][0]["id"]

    resp = client.get(f"/api/upload-students/{row_id}")
    assert resp.status_code == 200
    row = resp.json()
    assert row["id"] == row_id
    assert row["nmc_firstname"] == "ROSE 1"
    assert row["nmc_programmename"] == "Pre-registration nursing - Child"
    assert row["institute_name"] == "University of Chester"


def test_get_upload_student_unknown_id_is_404(client):
    resp = client.get("/api/upload-students/999999")
    assert resp.status_code == 404
