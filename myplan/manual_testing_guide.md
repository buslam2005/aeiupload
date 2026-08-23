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

   The CSV header below uses the upload file's own column names (see
   `requirements.md`'s "upload file field mapping"), not the internal
   `nmc_*` names - `app/services/parsing.py` translates one to the other at
   parse time.
   ```
   cat > /tmp/alt_ok.csv <<'EOF'
   NMC PIN,Title,First Name,Middle Name,Last Name,Date of Birth,Gender,Nationality,Place of Birth,Email Address,Address Line 1,Address Line 2,Address Line 3,City,Postcode,Country,Institute Code,Training Type,Course Code,Academic Level,Course Start Date,Course End Date,Pass Date,Start Date,End Date
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
   NMC PIN,Title,First Name,Middle Name,Last Name,Date of Birth,Gender,Nationality,Place of Birth,Email Address,Address Line 1,Address Line 2,Address Line 3,City,Postcode,Country,Institute Code,Training Type,Course Code,Academic Level,Course Start Date,Course End Date,Pass Date,Start Date,End Date
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

**Addendum (2026-08-22): upload file column mapping, two new lookups**

After Phase 4, the requester added an "upload file field mapping" section to
`requirements.md` specifying the upload file's own column headers (e.g. `NMC
PIN`, `Course Code`, `Academic Level`) - different from the internal `nmc_*`
names Phase 3 originally (and wrongly) assumed the file's header row would use
verbatim. `app/services/parsing.py` now translates via that explicit mapping;
the two curl examples above use the corrected headers. `Previous Institute
Code` has no table field and is dropped at parse time.

Two lookups were added to close a gap flagged in the Phase 4 addendum below:
- `GET /api/programme-titles?institute_code=...` - one entry per distinct
  `nmc_aeiprogrammetitle` (NOT collapsed by qualification level, unlike
  `GET /api/programmes`) - backs Upload Programme Selection's HEI Programme
  drop-down.
- `GET /api/upload-students/{id}` - a single upload_student row with its
  resolved `nmc_programmename` - backs the View Details page load.
  ```
  curl -s "http://localhost:8008/api/programme-titles?institute_code=1315"
  ```
  Expect 8 entries for institute `1315` (one per `AEI_programmes.csv` row for
  that institute), not the 4 the Revised Programme drop-down uses.

## Phase 4 - UI Development (visual/structural check, no live data required)

Phase 4 has no backend wiring yet (that's Phase 5) - every page runs on
hardcoded mock data in `frontend/app/lib/mockData.ts`, shaped exactly like the
real Phase 3 API responses. Two mock batches exist: batch **1** (all-success,
1 record, `SC1`) and batch **2** (mixed, 1 success + 1 failed record, no fixed
programme - the failed row has a "First name does not match..." error, useful
for checking the red inline error text).

1. `cd frontend && npm run lint` - clean, no errors/warnings.
2. `npm run build` - static export succeeds, all 7 routes listed as prerendered
   (`/`, `/upload-original-path`, `/upload-path-selection`,
   `/upload-programme-selection`, `/upload-result`, `/upload-summary`,
   `/view-details`).
3. `npm test` - all 24 tests pass (16 pure-function tests for `lib/format.ts`
   including the `distinctBy` de-dup helper, 5 for the `ErrorRecordsSubgrid`
   component, 2 for `FilePickerIcon`'s disabled/enabled states, 1 for the
   First Page selection-gated navigation).
4. Run the full app per section 1 (`npm run build` in frontend, then
   `uv run uvicorn app.main:app --port 8008` in backend) and click through the
   whole journey in a browser:
   - **First Page** (`/`): institute drop-down shows exactly 2 options,
     alphabetically sorted (`Canterbury Christ Church University - 8020` then
     `University of Chester - 1315`); Continue is disabled until one is picked.
   - **Upload Summary** (after Continue): right-aligned two-line block -
     "You are logged in as User1," alone on the first line, then the
     institute name + Change button together on the line underneath, both
     right-aligned; Upload Summary box shows the most recent batch's one-line
     result; Advanced Search greyed out and Search box disabled, now with a
     disabled magnifying-glass icon button next to it (both genuinely
     non-interactive, not just styled); the batches table lists both mock
     batches, batch 2 (newest) first, with correct BST date formatting
     (`DD/MM/YYYY h:mm AM/PM`) and status text (`Failed` for batch 2,
     `Processing Complete` for batch 1 - the latter is the literal text
     `UploadSummary.png` shows in that state, since the written spec only
     defines the `Failed` case).
   - **Upload Path Selection** (Upload file button): guidance text present;
     the two square buttons keep their original size, with their label text
     left-aligned inside the square (not centred); clicking a square
     highlights it; Next stays disabled until one is chosen, then routes to
     Programme Selection or Original Path accordingly; Back returns to Upload
     Summary.
   - **Upload Programme Selection** (Same course path): the HEI Programme
     drop-down now lists **8** distinct `nmc_aeiprogrammetitle` values for
     institute `1315` (not the 4 training-type/programme/route choices the
     Revised Programme drop-down uses elsewhere - each qualification-level
     variant, e.g. Apprenticeship vs Full Time, has its own title and is its
     own entry here); "Choose file" is an icon button, greyed out and
     unclickable until a programme is picked, then becomes enabled - pick a
     file, confirm Upload goes from disabled to enabled, click it - routes to
     `/upload-result?batchId=1`.
   - **Upload-OriginalPath** (Multiple courses path, navigate back and pick it
     instead): Institute Code drop-down shows codes only (`1315`, `8020`, no
     names) and is pre-filled from the institute chosen on First Page, but is
     changeable; Programme/Academic Route drop-downs are optional and disabled
     until an institute code is set; "Choose file" is the same icon button,
     greyed out until **Programme** specifically is selected (Institute Code
     alone isn't enough); picking a file and clicking Upload routes to
     `/upload-result?batchId=2`.
   - **Upload Result**: the 3x3 attributes grid (Uploaded By/Institute
     Code/Total Records, Batch ID/Programme/Successes, File/Academic
     Route/Errors) matches `UploadResult.png`'s layout; Uploaded Records and
     Error Records are both in their own scrollable region (~4 rows visible,
     scroll for the rest - there's only 1 row in each mock batch, so this is
     structural only until Phase 6 has enough rows to actually test scrolling).
   - **Error Records subgrid** (visit `/upload-result?batchId=2` to see a
     populated one): "select all" sits alone on its own line, with "Revised
     Programme" + its drop-down + Submit on the line underneath; select-all
     toggles every row checkbox; the row's own Revised Programme + Resubmit is
     disabled until a programme is chosen; clicking a row's Delete removes it
     from the table immediately (local state only - reload the page and it's
     back, since nothing is persisted yet); clicking View Details opens that
     row's `/view-details` page; clicking Resubmit or Submit navigates to
     Upload Summary, matching the spec's stated end state for those actions.
   - **View Details** (from the error row above): 4 tabs, all switchable; the
     3 inactive tab labels are a visibly darker grey than before (easier to
     read against white); Student Details shows the red error message
     ("First name does not match with organization's record.") directly under
     the First Name field; Date of Birth is shown/edited as `2002-05-24`
     (transformed from the stored `20020524`); Gender is shown/edited as
     "Female" (mapped from the stored `F`) - both per the exact
     `UI_requirements.md` field mappings; all tab panels share one fixed
     min-height so the tab strip doesn't jump between tabs; Back and Resubmit
     both present, Resubmit navigates to Upload Summary.
   - **Footer** (every page): tagline ("We're the independent regulator of
     more than 867 nursing and midwifery professionals" - not 867,000), 4
     columns (Our values, Popular links, More about, Stay updated), a "Follow
     us" row of 4 icons, and a bottom legal line reading "© The UK Health
     Council. The UKN is a registered charity in England and Wales (1091434)
     and Scotland (SC038362)". Confirm nothing in the footer is clickable (no
     underline/hover/cursor-pointer on any item - it's all plain text).
   - Confirm no 'NMC' logo/wordmark appears anywhere (the header just says
     "Prototype") and there are no header/footer navigation links on any page.

**Deliberate simplifications from the diagrams** (documented in
`developmentplan_execution.md`, flagged here for awareness): the "View
Details / Delete" drop-down button in `ErrorRecordsSubgrid.png` is rendered as
two plain inline actions instead of a dropdown menu (same two options, always
visible rather than hidden behind a click); the single-item "View Details"
drop-down on the Upload Summary batches table is a direct link for the same
reason. Field labels that literally read "NMC PIN" / "NMC Programme" were kept
as-is (per the exact field-mapping text in `UI_requirements.md`) rather than
scrubbed for the "do not show NMC" General Note, which was read as targeting
the organisation's logo/branding rather than these domain field names - flag
if you'd rather they read differently.

## Phase 5 - Integration (full click-through, backend + frontend together)

All 7 pages now call the real backend via `frontend/app/lib/api.ts` (no more
`mockData.ts` - deleted in this phase, nothing referenced it once wiring was
complete). Backend: **73/73** pytest tests pass (`cd backend && uv run pytest
-v`); frontend: **62/62** vitest tests pass (`cd frontend && npm test`, `npm
run lint`, `npm run build` all clean).

Run the single-port app (`cd frontend && npm run build`, then `cd ../backend
&& rm -rf data && uv run uvicorn app.main:app --port 8008` for a clean seeded
DB) and manually walk the whole journey in the browser, for **both** paths:

1. First Page -> institute drop-down now loads from `GET /api/institutes`
   (2 real entries) -> select one -> Upload Summary.
2. Upload Summary -> starts with "No previous uploads." (real, empty
   `GET /api/batches`) -> Upload File -> Upload Path Selection.
3. Alternate path: HEI Programme drop-down now loads the real 8
   `nmc_aeiprogrammetitle` choices from `GET /api/programme-titles` -> pick
   one whose institute/programme actually matches a `master_students` row
   (e.g. "BN (Hons) Children's Nursing" for institute 1315, which is
   `SC1`/`R`/`B Nurs (Hons)`) -> upload an all-success test file (matching
   `nmc_nmcpin` for that programme) -> Upload result POSTs to
   `/api/uploads/alternate-path` and routes to the **real** returned
   `batchId` (not a hardcoded `1`) -> Uploaded Records shows the row, Error
   Records is empty.
4. Back to Upload Summary -> Upload File again -> Alternate path -> upload a
   file with a deliberately wrong first name for a real PIN -> Upload Result
   shows it in Error Records with `"First name does not match with
   organization's record."` and correct real programme-choice options in
   both Revised Programme drop-downs (from `GET /api/programmes`).
5. From Error Records, note that "Revised Programme" only fixes a genuine
   **programme** mismatch - a name/DOB/etc. mismatch needs View Details
   instead. Verified flows:
   - **(c) View Details -> edit field -> Resubmit**: opens via
     `GET /api/upload-students/{id}` (real row, error message correctly
     shown under the offending field, e.g. First Name); editing the field
     and clicking Resubmit POSTs the full record to
     `/api/upload-students/{id}/resubmit-full` and lands on Upload Summary;
     confirmed via `GET /api/batches/{id}` that the row flipped to
     `Success`.
   - **(b) select-all + bulk revised programme + Submit**: on a batch with a
     genuine Programme mismatch (e.g. original-path file with the wrong
     `Course Code` for one student), select-all -> pick the correct Revised
     Programme -> Submit POSTs to
     `/api/upload-students/resubmit-with-programme` with all selected ids
     and lands on Upload Summary; confirmed both rows in the batch flip to
     `Success`.
   - **(a) single-row programme fix + resubmit**: same endpoint, one id -
     exercised via the automated test suite
     (`ErrorRecordsSubgrid.test.tsx`) and by inspection of `resubmitRow` in
     `ErrorRecordsSubgrid.tsx`, since a real single-programme-mismatch row
     wasn't separately re-created in the manual pass (the bulk case above
     covers the same code path).
   - **Delete**: clicking Delete now calls `DELETE
     /api/upload-students/{id}` before removing the row from the table -
     confirmed via `GET /api/batches/{id}` that the row and the batch's
     totals are gone for real, not just removed from local state; deleting
     the same id again correctly 404s (no undo).
6. Repeat steps 2-5 for the Original path (Upload-OriginalPath page instead of
   Upload Programme Selection) - Institute Code/Programme/Academic Route
   drop-downs now load from `GET /api/institutes` and `GET /api/programmes`.
   Programme and Academic Route are optional here: "Choose file" and Upload
   enable as soon as an Institute Code is picked, with no programme chosen
   at all - confirm a file uploads successfully in that state (fixed after
   the requester's manual test flagged it originally requiring a programme
   too; see the Phase 5 addendum in `developmentplan_execution.md`).
7. Confirm Upload Summary's subgrid lists every batch created above, newest
   first, with correct totals/status from `GET /api/batches`, and that "View
   Details" on a batch row reopens its Upload Result via `GET
   /api/batches/{id}`.
8. Edge case: visit `/upload-result?batchId=<id-that-does-not-exist>` -
   shows "Batch not found." rather than crashing (the page distinguishes
   "still loading" from "confirmed not found").
9. Institute context after resubmit: from any of the three resubmit flows
   (single-row, bulk, View Details), confirm Upload Summary's top-right
   "You are logged in as" block shows the **resubmitted record's own
   institute** (e.g. "University of Chester"), not "no institute selected" -
   check the URL too (`?institute_code=...&institute_name=...`). Fixed
   after the requester's manual test flagged View Details resetting this;
   the same fix applies to all three flows since they shared the root
   cause (see the Phase 5 addendum in `developmentplan_execution.md`).
   Delete was never affected - it doesn't navigate away.
10. Institute context after a successful upload: from Upload Result,
    click "Back to Upload Summary" - confirm the top-right institute
    display shows the **uploaded batch's own institute** (not "no institute
    selected"), and the URL carries `institute_code`/`institute_name`.
    Then click "Upload file" again and pick Alternate Path a second time -
    confirm Upload Programme Selection's HEI Programme drop-down loads all
    8 real options, not an empty "Select a programme" only. Fixed after the
    requester's manual test found the "Back to Upload Summary" link was the
    one remaining bare `/upload-summary` navigation the earlier resubmit
    fix hadn't reached, which silently starved the next page's programme
    lookup of an institute code (see Phase 5 addendum 2 in
    `developmentplan_execution.md`).
11. **Defect-fix round (2026-08-23)** - see the matching addendum in
    `developmentplan_execution.md` for root causes. Rebuild first
    (`cd frontend && npm run build`) so `frontend/out` is current:
    - **View Details tab 1**: open any error record's View Details. Order
      is NMC PIN, Title, First Name, **Last Name**, **Middle Name**,
      Maiden Name, Date of Birth, Gender, Nationality. Last Name shows the
      row's real last name (not blank) and is editable, same as Middle
      Name and Maiden Name - type into all three and confirm the typed
      text stays.
    - **View Details tab 3**: upload a file with a deliberately wrong
      Course Code (original path) for an otherwise-matching row - confirm
      the error shows as `"NMC programme does not match with
      organization's record."` **underneath the NMC Programme field**
      specifically (not a generic "Programme" message with no field
      association). Confirm an **Institute Code** field is present above
      Training type, pre-filled with the uploaded value, and editable.
    - **Cache issue**: on Upload Result, delete one Error Records row,
      then click "View Details" on a *different* row, then use the
      browser's own Back button (not the in-app Back link only - the
      browser control) to return to Upload Result. Confirm the deleted
      row does **not** reappear and "Errors" shows the correct reduced
      count - reproduce this without first doing a manual page refresh,
      since the bug only showed up on back-navigation.
    - **Revised Programme column**: on Upload Result, confirm the
      per-row "Revised Programme" drop-down in the Error Records subgrid
      lists programme titles (e.g. "BN (Hons) Adult Nursing") rather than
      the `R-AN1-B Nurs (Hons)-Pre-registration nursing - Adult` style
      concatenation. The bulk "Revised Programme" drop-down above the
      grid is unchanged (still shows the concatenated form) - this was an
      intentional, narrower change to just the per-row column.
12. **File-upload error handling (2026-08-23)** - see requirements.md's
    "Error handling at file upload" section for the exact wording, and the
    matching `developmentplan_execution.md` addendum for root cause. Test on
    both Upload Programme Selection (alternate path) and Upload-OriginalPath
    (original path) - rebuild first (`npm run build`) so `frontend/out` is
    current:
    - Pick an empty (0-byte) file, or any genuinely corrupted/non-spreadsheet
      file with a `.csv`/`.xlsx` extension, and click Upload - confirm
      `"Portal fails to recognize the file. Please check the file before
      upload it again."` appears directly underneath the file-upload icon,
      the page does **not** navigate away, and no batch is created (check
      Upload Summary afterwards).
    - Pick a file with only a header row (no data rows) and click Upload -
      confirm `"There is no student record in the file. Please check the
      file before upload it again."` appears the same way, and no batch is
      created.
    - Pick a file whose column headers don't match the portal's expected
      columns (e.g. a completely unrelated CSV) and click Upload - confirm
      `"Column header(s) are wrong. Please check the file before upload it
      again."` appears the same way, and no batch is created.
    - After any of the above, pick a different (valid) file - confirm the
      error message disappears immediately, before clicking Upload again.
    - Confirm a normal, valid file still uploads successfully and navigates
      to Upload Result exactly as before - this fix must not affect the
      happy path.
13. **Institute-context and cross-institute-history fixes (2026-08-23)** -
    see the matching `developmentplan_execution.md` addendum for root
    causes. Rebuild first (`npm run build`):
    - **Wrong-Institute-Code fix**: upload a file (original path) with a row
      whose Institute Code doesn't match any real institute - confirm the
      error is `"Institute code does not match with organization's
      record."`. Open View Details on that row, go to tab 3, correct the
      Institute Code to a real one (e.g. `1315`), click Resubmit - confirm
      you land on Upload Summary showing the **correct** institute (not "no
      institute selected"), and the URL carries
      `institute_code=...&institute_name=...`. Then click "Upload file" ->
      "Same course for all Students" -> Next, and confirm the HEI Programme
      drop-down is populated with real options (this was the second visible
      symptom of the same bug - it would previously be empty because the
      institute code carried forward as `""`).
    - **Cross-institute history fix**: with at least one upload already on
      record for one institute, go to First Page and select a *different*
      institute (or use "Change" from Upload Summary) - confirm Upload
      Summary's subgrid shows only that institute's own batches, none of
      the other institute's. Switch back and confirm the reverse.
14. **Country of Birth field added to View Details tab 1 (2026-08-23)** -
    upload a row with a Place of Birth that doesn't match the master
    record (everything else matching) - confirm the error is `"Country of
    birth does not match with organization's record."`. Open View Details
    on that row: confirm a **Country of Birth** field appears directly
    underneath Nationality, pre-filled with the uploaded value, editable,
    and showing that same error message underneath it. Confirm Title is
    still a plain free-text box (unchanged).
15. **Error Records subgrid: per-row checkboxes removed (2026-08-23)** -
    business decision, not a defect. On Upload Result, in the Error Records
    subgrid: confirm there is no checkbox in the leftmost column of any
    row (each row starts directly with its line number). Confirm the
    "select all" checkbox above the subgrid is still present, and still
    works: click it, pick a programme in the bulk Revised Programme
    drop-down, click Submit - confirm it resubmits **every** row in the
    subgrid (there's no way to select a subset any more) and navigates to
    Upload Summary. Confirm each row's own Revised Programme drop-down +
    Resubmit button (for fixing that row individually) still works
    unchanged.

## Phase 6 - Testing & Validation

This phase is the formal pass over everything above plus edge cases:
- Empty/corrupted/wrong-header file upload - confirm the specific error
  message from requirements.md's "Error handling at file upload" is shown
  underneath the file-upload icon, not a crash or a silent failure (item 12
  under Phase 5 above covers this in detail).
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
  cleanly before a live demonstration - or, more conveniently (2026-08-23),
  `cd backend && uv run python -m app.scripts.reset_db` does the same thing
  in one command without needing to find the file or restart the server. See
  `myplan/demo_data_reset_guide.md` for this and the upload-history-only
  purge script.
