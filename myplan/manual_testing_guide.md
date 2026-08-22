# Manual Testing Guide - AEI Student Upload (macOS / localhost)

Companion to `developmentplan.md`. Run these checks on your MacBook after each phase
is implemented, before moving to the next. All commands assume the repo root
`/Users/andrewlam/Documents/aeiupload` unless stated otherwise.

## 0. One-time prerequisites
- `uv --version`, `node --version`, `npm --version` all resolve.
- `backend/.env.example` exists. Copying it to `backend/.env` is optional - every
  value has a working default (SQLite file under `backend/data/`, frontend served
  from `../frontend/out`); only create `.env` if you want to override one of those
  locally.

## 1. Starting the app locally

**Full app, single port (the mode described in `requirements.md` General Notes)**
```
cd frontend && npm run build   # only needed the first time, or after frontend changes
cd ../backend
uv run uvicorn app.main:app --port 8008
```
Then open `http://localhost:8008` in a browser - this must serve the First Page
directly, with the API reachable at `http://localhost:8008/api/...`. (Until Phase 4
builds the real First Page, this serves the Phase 1 placeholder page instead - see
the Phase 1 section below.)

**Frontend-only hot-reload mode (Phase 4 UI work before integration)**
```
cd frontend
npm run dev
```
Opens on Next.js's own dev port (usually `3000`). Use this only to check page layout
before Phase 5 wiring; it will not have live data unless the backend is also running
with CORS opened for that port.

**Resetting the database between test runs**
Delete the SQLite file referenced in `backend/.env` and restart Uvicorn - table
creation should re-run the seed routine from `AEI_programmes.csv` and
`master_students.csv` automatically.

---

## Phase 1 - Project Setup

1. `cd backend && uv run pytest -v` - all 4 tests in `tests/test_phase1_setup.py`
   pass (health endpoint, root page served, unknown path 404s, SQLite DB file
   created on startup).
2. `cd frontend && npm run build` - completes without error and produces
   `frontend/out/index.html`.
3. `cd frontend && npm run lint` - no errors/warnings.
4. Start the full app per section 1 above
   (`uv run uvicorn app.main:app --port 8008`), then in a browser or via `curl`:
   - `http://localhost:8008/api/health` -> `{"status":"ok"}`.
   - `http://localhost:8008/` -> loads the "AEI Student Upload - Prototype"
     placeholder page, browser tab title matches.
   - `http://localhost:8008/does-not-exist` -> HTTP 404.
5. Confirm `backend/data/aei_upload.db` now exists (created automatically on first
   startup).

## Phase 2 - Database Development

Backend now seeds from its own copy of the sample data at
`backend/app/seed_data/` (copied from `requirement_doc/sample_data/`, which is
unchanged - the backend no longer reads from `requirement_doc/` at runtime).

1. `cd backend && uv run pytest -v` - all 15 tests pass (4 from Phase 1 + 11 in
   `tests/test_phase2_database.py`).
2. Delete any existing SQLite file (`rm -rf backend/data`), start the backend,
   confirm it starts without error (seed routine runs on table creation).
3. Open the SQLite file with a client (`sqlite3 backend/data/aei_upload.db` or a
   GUI):
   - `SELECT count(*) FROM programmes;` -> expect **14** (not 13 - see note below).
   - `SELECT count(*) FROM master_students;` -> expect **252** (not 251).
   - `SELECT count(*) FROM upload_students;` and `upload_batches` -> expect **0**.

   Note: the row counts in the CSV file names are one higher than a naive `wc -l`
   would suggest, because neither sample CSV ends with a trailing newline after
   its last row, which makes `wc -l` undercount by one. 14/252 are the true,
   `csv`-module-verified counts and what the app actually seeds.
4. Spot-check a row: pick one line from `AEI_programmes.csv` (e.g. institute code
   `1315`, programme `SC1`) and confirm the same row exists in the `programmes`
   table with matching `nmc_academicroute`, `nmc_qualificationlevel`,
   `nmc_aeiprogrammetitle`. `SC1` should resolve to **two** programme rows under
   `1315` - one per qualification level (`A` and `F`).
5. Do the same for one row of `master_students.csv` against `master_students`
   (e.g. `nmc_nmcpin = 16H0404E` -> first name `ROSE 1`, last name `LEE`,
   institute code `1315`).
6. Restart the backend a second time without deleting the DB file - confirm it does
   **not** duplicate seed rows (counts stay 14/252, not 28/504).
7. Confirm the sample-data cleanup: `SELECT * FROM programmes WHERE
   nmc_traininginstitutecode = '';` -> **0 rows** (both previously-blank rows now
   show institute `1315`); `.schema master_students` -> no `nmc_institutecode`
   column (removed as redundant with `nmc_traininginstitutecode`); `SELECT DISTINCT
   nmc_trainingtype FROM programmes;` -> exactly `F`, `G`, `M`, `R`, `S`, each with
   no trailing whitespace (`'['||nmc_trainingtype||']'` is a quick way to see any
   padding). All 14 rows are clean now, not just the `P2` ones.

## Phase 3 - Backend Logic Development

Run the full app per section 1 (`uv run uvicorn app.main:app --port 8008`), then
use `curl` against `http://localhost:8008/api/...`. All examples below use real
seed data: `16H0404E` (ROSE 1 LEE) and `16H0405E` (ROSE 2 LEE) are both genuinely
enrolled on institute `1315` / training type `R` / programme `SC1` / academic route
`B Nurs (Hons)` in `master_students.csv`.

1. `cd backend && uv run pytest -v` - all 52 tests pass (15 from Phases 1-2 + 37 in
   the three new `tests/test_phase3_*.py` files).

2. **Lookups**
   ```
   curl -s http://localhost:8008/api/institutes
   curl -s "http://localhost:8008/api/programmes?institute_code=1315"
   ```
   - Institutes: exactly 2 entries (`1315` University of Chester, `8020`
     Canterbury Christ Church University).
   - Programmes for `1315`: exactly **4** entries (`P2`, `AN1`, `SC1`, `DF3`), not
     6 - two of `AEI_programmes.csv`'s 1315 rows are the same programme at a
     different qualification level (`SC1` and `AN1` each have an `A`/`F` pair),
     collapsed into one dropdown choice since qualification level isn't part of
     the programme selection UI.

3. **Alternate path upload** (same course for all students)
   ```
   cat > /tmp/alt_ok.csv <<'EOF'
   nmc_nmcpin,nmc_nmctitlename,nmc_firstname,nmc_maidenname,nmc_lastname,nmc_dateofbirth,nmc_gender,nmc_nationalityname,nmc_countryofbirthname,nmc_email,nmc_addressline1,nmc_addressline2,nmc_addressline3,nmc_city,nmc_postcode,nmc_countryname,nmc_traininginstitutecode,nmc_trainingtype,nmc_programme,nmc_academicroute,nmc_coursestartdate,nmc_courseenddate,nmc_trainingexampassdate,nmc_trainingstartdate,nmc_trainingcompletiondate
   16H0404E,Miss,ROSE 1,,LEE,20020524,F,Nigerian,Nigeria,2211471@uknmc.org,London Road 1,BOLTON,,Woodford,CM168AH,England,1315,R,SC1,B Nurs (Hons),20200901,20290901,20260812,20220919,20260812
   EOF
   curl -s -F institute_code=1315 -F nmc_trainingtype=R -F nmc_programme=SC1 \
        -F nmc_academicroute="B Nurs (Hons)" -F file=@/tmp/alt_ok.csv \
        http://localhost:8008/api/uploads/alternate-path
   ```
   Expect `nmc_totalsuccessrecords: 1`, `nmc_totalfailedrecords: 0`, `status:
   "Processing Complete"`, and `uploaded_records[0].nmc_programmename ==
   "Pre-registration nursing - Child"` (resolved server-side).

   Now edit `/tmp/alt_ok.csv`, change `ROSE 1` to `WRONG NAME`, and re-run the same
   curl command. Expect `nmc_rowstatus: "Failed"` and `nmc_error1description:
   "First name does not match with organization's record."` - note the row's own
   `nmc_programme` column in the file doesn't even need to be right for this path;
   whatever programme you select in the form (`SC1`/`R`/`B Nurs (Hons)` above)
   overrides whatever the file says, by design.

4. **Original path upload** (multiple courses)
   ```
   cat > /tmp/orig.csv <<'EOF'
   nmc_nmcpin,nmc_nmctitlename,nmc_firstname,nmc_maidenname,nmc_lastname,nmc_dateofbirth,nmc_gender,nmc_nationalityname,nmc_countryofbirthname,nmc_email,nmc_addressline1,nmc_addressline2,nmc_addressline3,nmc_city,nmc_postcode,nmc_countryname,nmc_traininginstitutecode,nmc_trainingtype,nmc_programme,nmc_academicroute,nmc_coursestartdate,nmc_courseenddate,nmc_trainingexampassdate,nmc_trainingstartdate,nmc_trainingcompletiondate
   16H0404E,Miss,ROSE 1,,LEE,20020524,F,Nigerian,Nigeria,2211471@uknmc.org,London Road 1,BOLTON,,Woodford,CM168AH,England,1315,R,SC1,B Nurs (Hons),20200901,20290901,20260812,20220919,20260812
   16H0405E,Miss,ROSE 2,,LEE,20040321,F,British,England,2211471@uknmc.org,London Road 2,TARPORLEY,CHESHIRE,Woodford,CM160BS,England,1315,R,AN1,B Nurs (Hons),20200901,20290901,20260812,20230918,20260812
   EOF
   curl -s -F institute_code=1315 -F file=@/tmp/orig.csv \
        http://localhost:8008/api/uploads/original-path
   ```
   Row 1 (`SC1`, correct) -> `Success`. Row 2 (`AN1`, wrong - 16H0405E's real
   programme is `SC1`) -> `Failed` with `"Programme does not match with
   organization's record."` - confirms each row is matched against its **own**
   programme from the file, not forced to a single one. Note the response's
   `nmc_programme` (batch-level) is `null` here, since it wasn't supplied as a
   filter - that's expected and doesn't affect row matching either way.

5. **Resubmission** - using the batch from step 4 (`nmc_uploadbatchid` from the
   response; substitute below as `<BATCH_ID>` and the failed row's `id` as
   `<ROW_ID>`):
   - Single row + revised programme:
     ```
     curl -s -X POST http://localhost:8008/api/upload-students/resubmit-with-programme \
       -H "Content-Type: application/json" \
       -d '{"upload_student_ids": [<ROW_ID>], "nmc_trainingtype": "R", "nmc_programme": "SC1", "nmc_academicroute": "B Nurs (Hons)"}'
     ```
     Expect `nmc_rowstatus: "Success"`. Then `curl -s
     http://localhost:8008/api/batches/<BATCH_ID>` and confirm
     `nmc_totalsuccessrecords: 2`, `nmc_totalfailedrecords: 0`.
   - Bulk (repeat step 4 to get a fresh batch with 2 failed rows, then pass both
     ids in `upload_student_ids`) - confirm both flip to `Success` in one call.
   - Full-record edit (View Details): upload a row with an unknown PIN (e.g.
     change `16H0404E` to `99999999` in a test file), note its `id`, then send
     **every** field back with its correct value (any field left out of the JSON
     body is set to blank/null, which will itself become a fresh mismatch against
     the master record - the endpoint expects the complete corrected record, the
     same way View Details redisplays and resubmits the whole form, not a partial
     patch):
     ```
     curl -s -X POST http://localhost:8008/api/upload-students/<ROW_ID>/resubmit-full \
       -H "Content-Type: application/json" \
       -d '{"nmc_nmcpin": "16H0404E", "nmc_nmctitlename": "Miss", "nmc_firstname": "ROSE 1", "nmc_maidenname": null, "nmc_lastname": "LEE", "nmc_dateofbirth": "20020524", "nmc_gender": "F", "nmc_nationalityname": "Nigerian", "nmc_countryofbirthname": "Nigeria", "nmc_email": "2211471@uknmc.org", "nmc_addressline1": "London Road 1", "nmc_addressline2": "BOLTON", "nmc_addressline3": null, "nmc_city": "Woodford", "nmc_postcode": "CM168AH", "nmc_countryname": "England", "nmc_traininginstitutecode": "1315", "nmc_trainingtype": "R", "nmc_programme": "SC1", "nmc_academicroute": "B Nurs (Hons)", "nmc_coursestartdate": "20200901", "nmc_courseenddate": "20290901", "nmc_trainingexampassdate": "20260812", "nmc_trainingstartdate": "20220919", "nmc_trainingcompletiondate": "20260812"}'
     ```
     Expect `nmc_rowstatus: "Success"`. (This is exactly what happens if you only
     send the fields shown in the first draft of this guide, minus the address/
     course-date/nationality fields: the row still comes back `Failed`, on those
     now-blank fields - caught and fixed while writing this guide, kept here as a
     working example rather than a trap.)

6. **Delete** - `curl -s -X DELETE
   http://localhost:8008/api/upload-students/<ROW_ID>` on a failed row -> `204`.
   Confirm via `GET /api/batches/<BATCH_ID>` that `nmc_totalrecords` dropped by 1
   and the row is gone from `error_records`. Delete the same id again -> `404`
   (no undo).

7. **Edge cases** - unsupported file extension (`curl ... -F file=@/tmp/x.txt` on
   either upload endpoint) -> `400`; a batch/upload-student id that doesn't exist
   on any read/resubmit/delete endpoint -> `404`; an upload file with a header row
   but zero data rows -> `200` with `nmc_totalrecords: 0` (no crash).

**Design notes worth knowing before testing:** the 5 error-description slots are
filled in the order mismatches are found (Programme check first - a combined
check across institute/training type/programme/academic route - then the fields
shown on the View Details page in tab order), capped at 5; a PIN with no matching
`master_students` row at all reports a single `"NMC PIN does not match with
organization's record."` error rather than attempting further field checks. Full
rationale is in `developmentplan_execution.md` Phase 3.

## Phase 4 - UI Development (visual/structural check, no live data required)

With `npm run dev` running, open each page and compare side-by-side against its
diagram in `requirement_doc/diagrams/`:

- First Page: institute drop-down present, values formatted `Name - Code`.
- Upload Summary: Change button, Upload File button, Upload Summary box, greyed-out
  Advanced Search, disabled Search box, subgrid with all specified columns.
- Upload Path Selection: guidance text matches spec wording; two purple buttons.
- Upload Programme Selection: single programme drop-down, file picker, Upload
  button.
- Upload-OriginalPath: institute code (mandatory), programme + academic route
  (optional), file picker, Upload button.
- Upload Result: header attributes block, Uploaded Records + Error Records
  subgrids, 4-row visible height.
- Error Records subgrid: select-all checkbox, top Revised Programme + Submit, all
  per-row columns present, Resubmit button, View Details/Delete dropdown.
- View Details: 4 equal-height tabs with the exact field lists per tab.
- No 'NMC' text/logo anywhere ('Prototype' shown instead); no header/footer links.
- Layout/spacing consistent when navigating between pages.

## Phase 5 - Integration (full click-through, backend + frontend together)

Run the single-port app (`uv run uvicorn app.main:app --port 8008`) and manually
walk the whole journey in the browser, for **both** paths:

1. First Page -> select institute -> Upload Summary.
2. Upload Summary -> Upload File -> Upload Path Selection.
3. Alternate path: pick programme -> upload the all-success test file -> Upload
   Result shows all rows in Uploaded Records, none in Error Records.
4. Back to Upload Summary -> Upload File again -> Alternate path -> upload the
   mismatch test file -> Upload Result shows failures in Error Records with correct
   messages.
5. From Error Records: try flow (a) single-row programme fix + resubmit, (b)
   select-all + bulk revised programme + Submit, (c) View Details -> edit field ->
   Resubmit. Each must land back on Upload Summary with a new batch row visible.
6. Repeat steps 2-5 for the Original path (Upload-OriginalPath page instead of
   Upload Programme Selection).
7. Confirm Upload Summary's subgrid now lists every batch created above, with
   correct totals/status, and that "View Details" on a batch row reopens its
   Upload Result.

## Phase 6 - Testing & Validation

This phase is the formal pass over everything above plus edge cases:
- Empty file upload - confirm a sane response (no crash).
- File with a row missing required fields - confirm it fails cleanly with a
  meaningful error rather than a 500.
- All 5 error slots individually triggered at least once across your test files.
- Every `View Details` tab's field mapping and date-format transform checked against
  one real record (`nmc_dateofbirth` YYYYMMDD -> `YYYY-MM-DD` shown in the UI).
- Full diagram-by-diagram visual re-check now that data is live (not just layout).

## Phase 7 - Cloud Deployment Readiness (still tested locally)

1. Build the frontend for production: `npm run build` (static export to
   `frontend/out`).
2. Start the backend the same way it would run on a server:
   ```
   cd backend
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8008
   ```
3. From the browser, hit `http://localhost:8008` (and, if you want to simulate a
   remote client, `http://<your Mac's LAN IP>:8008` from another device on the same
   Wi-Fi) - confirm the full journey from Phase 5 still works against the production
   build, through the single port, with no console errors about missing assets or
   CORS.
4. Stop the process, delete the SQLite file, restart, and confirm the seed data
   reloads - this simulates a fresh cloud deploy on ephemeral storage.
5. Grep the codebase for `localhost` / hardcoded ports outside `.env` handling -
   should return nothing meaningful.

## Phase 8 - Prototype Polish

- One more full click-through of both paths, purely looking for spacing/alignment
  drift between pages.
- Confirm again: no 'NMC' anywhere, no header/footer links, Search stays disabled,
  Advanced Search stays greyed out.
- Delete the SQLite file once more and restart, to prove the demo can be reset
  cleanly before a live demonstration.
