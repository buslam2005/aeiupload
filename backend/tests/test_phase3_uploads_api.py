CSV_HEADER = (
    "nmc_nmcpin,nmc_nmctitlename,nmc_firstname,nmc_maidenname,nmc_lastname,nmc_dateofbirth,"
    "nmc_gender,nmc_nationalityname,nmc_countryofbirthname,nmc_email,nmc_addressline1,"
    "nmc_addressline2,nmc_addressline3,nmc_city,nmc_postcode,nmc_countryname,"
    "nmc_traininginstitutecode,nmc_trainingtype,nmc_programme,nmc_academicroute,"
    "nmc_coursestartdate,nmc_courseenddate,nmc_trainingexampassdate,nmc_trainingstartdate,"
    "nmc_trainingcompletiondate"
)

# 16H0404E's real master record: SC1 / R / B Nurs (Hons) / institute 1315.
ROSE1_ROW = (
    "16H0404E,Miss,ROSE 1,,LEE,20020524,F,Nigerian,Nigeria,2211471@uknmc.org,London Road 1,"
    "BOLTON,,Woodford,CM168AH,England,1315,R,SC1,B Nurs (Hons),20200901,20290901,20260812,"
    "20220919,20260812"
)

# 16H0405E's real master record: also SC1 / R / B Nurs (Hons) / institute 1315.
ROSE2_ROW = (
    "16H0405E,Miss,ROSE 2,,LEE,20040321,F,British,England,2211471@uknmc.org,London Road 2,"
    "TARPORLEY,CHESHIRE,Woodford,CM160BS,England,1315,R,SC1,B Nurs (Hons),20200901,20290901,"
    "20260812,20230918,20260812"
)


def csv_bytes(*rows: str) -> bytes:
    return (CSV_HEADER + "\n" + "\n".join(rows) + "\n").encode()


def upload_alternate(client, csv_content: bytes, filename="students.csv", **overrides):
    data = {
        "institute_code": "1315",
        "nmc_trainingtype": "R",
        "nmc_programme": "SC1",
        "nmc_academicroute": "B Nurs (Hons)",
        **overrides,
    }
    files = {"file": (filename, csv_content, "text/csv")}
    return client.post("/api/uploads/alternate-path", data=data, files=files)


def upload_original(client, csv_content: bytes, filename="students.csv", **overrides):
    data = {"institute_code": "1315", **overrides}
    files = {"file": (filename, csv_content, "text/csv")}
    return client.post("/api/uploads/original-path", data=data, files=files)


# --- Lookups -----------------------------------------------------------------


def test_list_institutes(client):
    resp = client.get("/api/institutes")
    assert resp.status_code == 200
    assert resp.json() == [
        {"code": "8020", "name": "Canterbury Christ Church University"},
        {"code": "1315", "name": "University of Chester"},
    ]


def test_list_programmes_for_institute_deduplicates_qualification_level(client):
    resp = client.get("/api/programmes", params={"institute_code": "1315"})
    assert resp.status_code == 200
    choices = resp.json()
    # 4 distinct (trainingtype, programme, academicroute) tuples, not 6 raw rows
    # (SC1 and AN1 each have 2 qualification-level rows in programmes).
    assert len(choices) == 4
    assert {(c["nmc_trainingtype"], c["nmc_programme"]) for c in choices} == {
        ("F", "P2"),
        ("R", "AN1"),
        ("R", "SC1"),
        ("S", "DF3"),
    }


def test_list_programmes_excludes_other_institutes(client):
    resp = client.get("/api/programmes", params={"institute_code": "8020"})
    codes = {c["nmc_programme"] for c in resp.json()}
    assert "SC1" not in codes  # SC1 belongs to institute 1315 only


# --- Alternate path upload -----------------------------------------------------


def test_alternate_path_full_success(client):
    resp = upload_alternate(client, csv_bytes(ROSE1_ROW))
    assert resp.status_code == 200
    batch = resp.json()
    assert batch["nmc_totalrecords"] == 1
    assert batch["nmc_totalsuccessrecords"] == 1
    assert batch["nmc_totalfailedrecords"] == 0
    assert batch["status"] == "Processing Complete"
    assert batch["institute_name"] == "University of Chester"
    assert len(batch["uploaded_records"]) == 1
    assert batch["uploaded_records"][0]["nmc_linenumber"] == 2
    assert batch["uploaded_records"][0]["nmc_programmename"] == "Pre-registration nursing - Child"


def test_alternate_path_overrides_file_programme_with_selected_programme(client):
    # File claims AN1, but the alternate-path selection is SC1 (the row's real
    # master programme) - the selected programme should win, not the file's.
    bad_programme_row = ROSE1_ROW.replace(",SC1,", ",AN1,")
    resp = upload_alternate(client, csv_bytes(bad_programme_row))
    batch = resp.json()
    assert batch["nmc_totalsuccessrecords"] == 1
    assert batch["nmc_totalfailedrecords"] == 0


def test_alternate_path_mismatch_reports_first_name_error(client):
    wrong_name_row = ROSE1_ROW.replace(",ROSE 1,", ",WRONG NAME,")
    resp = upload_alternate(client, csv_bytes(wrong_name_row))
    batch = resp.json()
    assert batch["status"] == "Failed"
    assert len(batch["error_records"]) == 1
    assert batch["error_records"][0]["nmc_error1description"] == (
        "First name does not match with organization's record."
    )


def test_alternate_path_unknown_pin_reports_pin_error(client):
    unknown_pin_row = ROSE1_ROW.replace("16H0404E", "99999999")
    resp = upload_alternate(client, csv_bytes(unknown_pin_row))
    batch = resp.json()
    assert batch["error_records"][0]["nmc_error1description"] == (
        "NMC PIN does not match with organization's record."
    )


def test_alternate_path_unsupported_file_type_returns_400(client):
    resp = upload_alternate(client, b"whatever", filename="students.txt")
    assert resp.status_code == 400


def test_alternate_path_empty_file_creates_zero_record_batch(client):
    resp = upload_alternate(client, (CSV_HEADER + "\n").encode())
    assert resp.status_code == 200
    batch = resp.json()
    assert batch["nmc_totalrecords"] == 0
    assert batch["uploaded_records"] == []
    assert batch["error_records"] == []


# --- Original path upload -------------------------------------------------------


def test_original_path_uses_file_programme_not_forced(client):
    # File's own programme (SC1) is correct for both students - original path
    # must use it as-is, not force any particular programme onto the rows.
    resp = upload_original(client, csv_bytes(ROSE1_ROW, ROSE2_ROW))
    batch = resp.json()
    assert batch["nmc_totalsuccessrecords"] == 2
    assert batch["nmc_totalfailedrecords"] == 0


def test_original_path_wrong_file_programme_is_reported(client):
    wrong_programme_row = ROSE1_ROW.replace(",SC1,", ",AN1,")
    resp = upload_original(client, csv_bytes(wrong_programme_row))
    batch = resp.json()
    assert batch["nmc_totalfailedrecords"] == 1
    assert batch["error_records"][0]["nmc_error1description"] == (
        "Programme does not match with organization's record."
    )


def test_original_path_programme_and_route_are_optional(client):
    resp = upload_original(client, csv_bytes(ROSE1_ROW))
    assert resp.status_code == 200
    assert resp.json()["nmc_programme"] is None


# --- Batch listing / detail ------------------------------------------------------


def test_batches_listed_newest_first(client):
    upload_alternate(client, csv_bytes(ROSE1_ROW))
    upload_alternate(client, csv_bytes(ROSE2_ROW))
    resp = client.get("/api/batches")
    ids = [b["nmc_uploadbatchid"] for b in resp.json()]
    assert ids == sorted(ids, reverse=True)
    assert len(ids) == 2


def test_get_missing_batch_is_404(client):
    resp = client.get("/api/batches/999")
    assert resp.status_code == 404


# --- Resubmission: single row with revised programme ------------------------------


def test_resubmit_single_row_with_correct_programme_fixes_it(client):
    wrong_programme_row = ROSE1_ROW.replace(",SC1,", ",AN1,")
    batch = upload_original(client, csv_bytes(wrong_programme_row)).json()
    row_id = batch["error_records"][0]["id"]

    resp = client.post(
        "/api/upload-students/resubmit-with-programme",
        json={
            "upload_student_ids": [row_id],
            "nmc_trainingtype": "R",
            "nmc_programme": "SC1",
            "nmc_academicroute": "B Nurs (Hons)",
        },
    )
    assert resp.status_code == 200
    assert resp.json()[0]["nmc_rowstatus"] == "Success"

    refreshed = client.get(f"/api/batches/{batch['nmc_uploadbatchid']}").json()
    assert refreshed["nmc_totalsuccessrecords"] == 1
    assert refreshed["nmc_totalfailedrecords"] == 0
    assert refreshed["status"] == "Processing Complete"


def test_resubmit_bulk_rows_with_one_revised_programme(client):
    wrong = [row.replace(",SC1,", ",AN1,") for row in (ROSE1_ROW, ROSE2_ROW)]
    batch = upload_original(client, csv_bytes(*wrong)).json()
    ids = [r["id"] for r in batch["error_records"]]
    assert len(ids) == 2

    resp = client.post(
        "/api/upload-students/resubmit-with-programme",
        json={
            "upload_student_ids": ids,
            "nmc_trainingtype": "R",
            "nmc_programme": "SC1",
            "nmc_academicroute": "B Nurs (Hons)",
        },
    )
    statuses = [row["nmc_rowstatus"] for row in resp.json()]
    assert statuses == ["Success", "Success"]

    refreshed = client.get(f"/api/batches/{batch['nmc_uploadbatchid']}").json()
    assert refreshed["nmc_totalsuccessrecords"] == 2
    assert refreshed["nmc_totalfailedrecords"] == 0


def test_resubmit_with_programme_unknown_id_is_404_and_does_not_partially_apply(client):
    wrong_programme_row = ROSE1_ROW.replace(",SC1,", ",AN1,")
    batch = upload_original(client, csv_bytes(wrong_programme_row)).json()
    real_id = batch["error_records"][0]["id"]

    resp = client.post(
        "/api/upload-students/resubmit-with-programme",
        json={
            "upload_student_ids": [real_id, 999999],
            "nmc_trainingtype": "R",
            "nmc_programme": "SC1",
            "nmc_academicroute": "B Nurs (Hons)",
        },
    )
    assert resp.status_code == 404

    # the valid id earlier in the list must not have been silently fixed either
    refreshed = client.get(f"/api/batches/{batch['nmc_uploadbatchid']}").json()
    assert refreshed["nmc_totalfailedrecords"] == 1
    assert refreshed["nmc_totalsuccessrecords"] == 0


# --- Resubmission: full record edit (View Details) --------------------------------


def test_resubmit_full_record_edit_fixes_unknown_pin(client):
    unknown_pin_row = ROSE1_ROW.replace("16H0404E", "99999999")
    batch = upload_alternate(client, csv_bytes(unknown_pin_row)).json()
    row_id = batch["error_records"][0]["id"]

    corrected = {
        "nmc_nmcpin": "16H0404E",
        "nmc_nmctitlename": "Miss",
        "nmc_firstname": "ROSE 1",
        "nmc_maidenname": None,
        "nmc_lastname": "LEE",
        "nmc_dateofbirth": "20020524",
        "nmc_gender": "F",
        "nmc_nationalityname": "Nigerian",
        "nmc_countryofbirthname": "Nigeria",
        "nmc_email": "2211471@uknmc.org",
        "nmc_addressline1": "London Road 1",
        "nmc_addressline2": "BOLTON",
        "nmc_addressline3": None,
        "nmc_city": "Woodford",
        "nmc_postcode": "CM168AH",
        "nmc_countryname": "England",
        "nmc_traininginstitutecode": "1315",
        "nmc_trainingtype": "R",
        "nmc_programme": "SC1",
        "nmc_academicroute": "B Nurs (Hons)",
        "nmc_coursestartdate": "20200901",
        "nmc_courseenddate": "20290901",
        "nmc_trainingexampassdate": "20260812",
        "nmc_trainingstartdate": "20220919",
        "nmc_trainingcompletiondate": "20260812",
    }
    resp = client.post(f"/api/upload-students/{row_id}/resubmit-full", json=corrected)
    assert resp.status_code == 200
    assert resp.json()["nmc_rowstatus"] == "Success"

    refreshed = client.get(f"/api/batches/{batch['nmc_uploadbatchid']}").json()
    assert refreshed["nmc_totalsuccessrecords"] == 1
    assert refreshed["nmc_totalfailedrecords"] == 0


def test_resubmit_full_unknown_student_id_is_404(client):
    resp = client.post("/api/upload-students/999999/resubmit-full", json={})
    assert resp.status_code == 404


# --- Delete ------------------------------------------------------------------------


def test_delete_error_row_updates_batch_totals(client):
    unknown_pin_row = ROSE1_ROW.replace("16H0404E", "99999999")
    batch = upload_alternate(client, csv_bytes(unknown_pin_row)).json()
    row_id = batch["error_records"][0]["id"]
    batch_id = batch["nmc_uploadbatchid"]

    resp = client.delete(f"/api/upload-students/{row_id}")
    assert resp.status_code == 204

    refreshed = client.get(f"/api/batches/{batch_id}").json()
    assert refreshed["nmc_totalrecords"] == 0
    assert refreshed["nmc_totalfailedrecords"] == 0
    assert refreshed["error_records"] == []


def test_delete_is_final_no_undo(client):
    unknown_pin_row = ROSE1_ROW.replace("16H0404E", "99999999")
    batch = upload_alternate(client, csv_bytes(unknown_pin_row)).json()
    row_id = batch["error_records"][0]["id"]

    first = client.delete(f"/api/upload-students/{row_id}")
    assert first.status_code == 204
    second = client.delete(f"/api/upload-students/{row_id}")
    assert second.status_code == 404
