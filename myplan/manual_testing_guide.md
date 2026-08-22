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

Use `curl` (or a REST client) against `http://localhost:8008/api/...` - adjust
paths to whatever the implementation names them.

1. **Lookups**
   - Institutes endpoint returns a distinct list; cross-check the count of distinct
     `nmc_traininginstitutecode` values in `AEI_programmes.csv`.
   - Programmes-by-institute endpoint, called with one institute code, returns only
     that institute's programme rows.
2. **Alternate path upload** (same course for all students)
   - Prepare a test file from `master_students.csv`: copy 3-5 full rows (header +
     data) that all share one institute/programme into a `.csv`, unchanged - this is
     your "all-success" file.
   - Prepare a second test file: same rows, but hand-edit one field per row (e.g.
     first name on row 1, first name + DOB on row 2) to force mismatches.
   - POST the all-success file to the alternate-path endpoint with that institute +
     programme selected. Confirm response batch totals: `total = success`,
     `errors = 0`.
   - POST the mismatch file the same way. Confirm each row's `nmc_rowstatus =
     'Failed'` and the right `nmc_errorNdescription` field is populated with the
     "<Field> does not match with organization's record." message, in field-check
     order.
3. **Original path upload** (multiple courses)
   - Build a test file spanning 2+ programmes (mixed rows from
     `master_students.csv`).
   - POST with only institute code selected (no programme/academic route) - confirm
     rows are matched against their own programme, not forced to one.
   - Repeat with programme/academic route also selected as optional filters, and
     confirm behaviour matches the spec (filters narrow the drop-downs, they do not
     override each row's own programme).
4. **Resubmission**
   - Take a `Failed` row from step 2, resubmit it via the single-row endpoint with a
     different (correct) programme - confirm it flips to `Success` and the batch
     totals update.
   - Take 2+ `Failed` rows, resubmit via the bulk endpoint with one revised
     programme - confirm all selected rows update together.
   - Take a `Failed` row, resubmit via the full-record edit endpoint with the actual
     field corrected (not just the programme) - confirm it re-validates and flips to
     `Success`.
5. **Delete** a single error row - confirm it is gone from `upload_students` and
   batch totals decrease; confirm there's no undo endpoint/behaviour.
6. Run `uv run pytest` - all matching-logic unit tests pass (full match, each of the
   5 single-field mismatches, multi-field mismatch).

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
