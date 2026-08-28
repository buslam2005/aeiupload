# Manual Testing Guide - Authorized Signatory (macOS / localhost)

Companion to `developmentplan_AS.md`. Run these checks on your MacBook after each
phase of that plan is implemented, before moving to the next - same convention as
`manual_testing_guide.md` for the Upload module. All commands assume the repo root
`/Users/andrewlam/Documents/aeiupload` unless stated otherwise. This module adds
routes/tables alongside the Upload module - it does not touch `programmes`,
`master_students`, or any upload logic, so the existing guide's checks should keep
passing unchanged throughout.

Test fixtures used throughout this guide, all from
`requirement_doc/sample_data/masterapplicants.csv` (institute `1315`, University of
Chester):
- **`26H0401Z`** / surname `Young` - active (`nmc_active = Yes`), one course only
  (course 1 = `R`/`AN1`/`B Nurs (Hons)`/`F`).
- **`26H0417Z`** / surname `Young` - same course as above, but **inactive**
  (`nmc_active = No`) - use this to confirm inactive PINs never match in the Add
  Signatory flow, even with a correct surname.
- Institute `1315`'s 8 distinct programme combinations (from `AEI_programmes.csv`,
  used to populate the Course Lookup pop-up and to add courses 2-5):
  `R-SC1-B Nurs (Hons)-A`, `R-SC1-B Nurs (Hons)-F`, `R-AN1-B Nurs (Hons)-A`,
  `R-AN1-B Nurs (Hons)-F`, `F-P2-Level 7-F`, `F-P2-Level 7-P`, `S-DF3-PG Dip-A`,
  `S-DF3-PG Dip-F`.

## 0. Starting the app locally

Same as `manual_testing_guide.md` section 1 - single port:
```
cd frontend && npm run build
cd ../backend
uv run uvicorn app.main:app --port 8008
```
Open `http://localhost:8008`, landing page tile "Manage approved signatories" is the
entry point for this module once Phase 3's wiring is done (before that, reach pages
directly by URL for structural checks).

**Resetting the database between test runs**: delete the SQLite file and restart -
seeding should reload `programmes`, `master_students`, and now `masterapplicants.csv`
into `master_applicants`; `audit_records` starts empty every time.

---

## Phase 1 - Data Model

1. `cd backend && uv run pytest -v` - existing Upload-module tests still pass
   (regression check), plus the new seeding tests for this phase.
2. `rm -rf backend/data`, start the backend, confirm it starts without error.
3. Open the SQLite file (`sqlite3 backend/data/aei_upload.db`):
   - `SELECT count(*) FROM master_applicants;` -> **24**.
   - `SELECT count(*) FROM master_applicants WHERE nmc_active='Yes';` -> **16**.
   - `SELECT count(*) FROM master_applicants WHERE nmc_active='No';` -> **8**.
   - `SELECT count(*) FROM audit_records;` -> **0**.
4. Spot-check `26H0401Z` against the CSV: `nmc_lastname='Young'`,
   `nmc_firstname='Mary 1'`, `nmc_institutecode='1315'`,
   `nmc_trainingtypecode='R'`, `nmc_programmecode='AN1'`,
   `nmc_academiclevel='B Nurs (Hons)'`, and - the CSV header typo check -
   `nmc_qualificationroute='F'` (not null/empty; confirms the loader correctly
   remapped the CSV's misspelled `mc_qualificationroute` header). Confirm
   `nmc_course1trainingtypecode='R'`, `nmc_course1programmecode='AN1'` (mirrors the
   top-level course, per the plan's Assumption 2), and
   `nmc_course2trainingtypecode` through `nmc_course5trainingtypecode` are all
   null/empty (only course 1 populated in the seed data).
5. Restart the backend a second time without deleting the DB file - confirm
   `master_applicants`/`audit_records` counts are unchanged (no duplicate seeding).

## Phase 2 - Backend Logic

Run the full app, then use `curl` against `http://localhost:8008/api/...`.

1. `cd backend && uv run pytest -v` - all new Phase 2 tests pass, no regressions.

2. **Signatories list**
   ```
   curl -s "http://localhost:8008/api/signatories?active=Yes"
   curl -s "http://localhost:8008/api/signatories?active=No"
   ```
   Expect 16 and 8 entries respectively; each entry carries enough fields to render
   the First Page subgrid (Name, Approved course title source fields, Practice
   Type/Register Part arrays, Registration expiry date, Date Created, By Who).

3. **View Details**
   ```
   curl -s "http://localhost:8008/api/signatories/26H0401Z"
   ```
   Expect the static fields plus exactly **1** course row (course 1:
   `R`/`AN1`/`B Nurs (Hons)`/`F`), with `nmc_institutename` = "University of
   Chester" and an `nmc_aeiprogrammetitle` resolved by joining `programmes` on
   institute `1315` + `R`/`AN1`/`B Nurs (Hons)` (per the plan's display-time-lookup
   assumption).

4. **Course Lookup choices**
   ```
   curl -s "http://localhost:8008/api/course-choices?institute_code=1315"
   ```
   Expect **8** entries, each with `nmc_programmename`, `nmc_trainingtype`,
   `nmc_programme`, `nmc_academicroute`, and `nmc_qualificationlevelname` (the
   descriptive text - "Full Time"/"Part Time"/"Apprenticeship" - not the raw
   `nmc_qualificationlevel` code letter).

5. **Add Course**
   ```
   curl -s -X POST http://localhost:8008/api/signatories/26H0401Z/courses \
     -H "Content-Type: application/json" \
     -d '{"nmc_trainingtype": "R", "nmc_programme": "SC1", "nmc_academicroute": "B Nurs (Hons)", "nmc_qualificationlevel": "F"}'
   ```
   Expect course 2 populated (`RSC1` in the audit trail's new-value concatenation -
   confirm via the next `GET`). Then:
   ```
   curl -s "http://localhost:8008/api/signatories/26H0401Z/audit"
   ```
   Expect 1 new row: `nmc_attributechanged='Approved Course'`,
   `nmc_previousvalue=''`, `nmc_newvalue='RSC1'` (no separator, per the resolved
   "Approved course title" convention).

6. **Fill to capacity, then reject** - repeat step 5 three more times with the
   remaining combos to fill courses 3, 4, 5. A 6th add attempt (all 5 slots full)
   must be rejected (4xx), not silently ignored or overwrite an existing slot.

7. **Remove Course**
   - On a fresh signatory with only course 1 (e.g. re-seed, or use `26H0402Z`),
     attempt to remove course 1 -> rejected (only course left).
   - On `26H0401Z` (now with 5 courses from steps 5-6), remove course 2 -> its 4
     fields purged (null/empty), audit row written with
     `nmc_previousvalue='RSC1'`, `nmc_newvalue=''`.

8. **Add Signatory match**
   ```
   curl -s -X POST http://localhost:8008/api/signatories/match \
     -H "Content-Type: application/json" -d '{"nmc_pin": "26H0401Z", "nmc_lastname": "Young"}'
   ```
   -> match, returns the applicant's static fields + course rows.
   ```
   curl -s -X POST http://localhost:8008/api/signatories/match \
     -H "Content-Type: application/json" -d '{"nmc_pin": "26H0417Z", "nmc_lastname": "Young"}'
   ```
   -> **no match**, even though PIN + surname are both individually valid, because
   `26H0417Z` is `nmc_active = No` (confirms the active-only lookup rule).
   ```
   curl -s -X POST http://localhost:8008/api/signatories/match \
     -H "Content-Type: application/json" -d '{"nmc_pin": "26H0401Z", "nmc_lastname": "WrongName"}'
   ```
   -> no match (surname mismatch).

9. **View Audits pagination** - after steps 5-7 have produced several audit rows
   for `26H0401Z`, confirm the audit endpoint supports paging (or returns
   everything sorted by `nmc_modifiedon`, newest first, ready for the frontend to
   paginate).

## Phase 3 - UI Development (visual/structural check, mock data only)

No backend wiring yet - pages run on mock data shaped like the real Phase 2
responses.

1. `cd frontend && npm run lint` - clean.
2. `npm run build` - static export succeeds, all new routes prerendered:
   `/authorised-signatories`, `/authorised-signatories/view-details`,
   `/authorised-signatories/view-audits`, `/authorised-signatories/add-signatory`,
   `/authorised-signatories/add-signatory/detail`.
3. `npm test` - new component/page tests pass, no regressions in existing tests.
4. Diagram-by-diagram visual check (`requirement_doc/diagrams/`), each against its
   matching page:
   - **AuthorisedSignatoriesFirstPage.png / ..._InactiveSignatories.png**: 3
     decorative filter drop-downs (AEI/Name/NMC PIN) + disabled "Search
     Signatories"; Active/Inactive toggle above the subgrid; subgrid columns Name,
     Approved course title, Practice Type, Register Part, Registration expiry
     date, Date Created, By Who, plus the row action drop-down
     (`AuthorisedSignatoriesFirstPage_subgrid_dropdownbox.png`: View Details, View
     Audits, Remove Signatory - Remove Signatory present only for Active rows);
     "Add new signatory" button.
   - **AuthorisedSignatoriesFirstPage_ViewDetails.png**: static field block
     (NMC PIN, Surname, Full Name, Registration Expiry Date, Added By, AEI,
     Created On, Register Part tag list, Practice Type tag list - Register Part
     showing 3 possible tags, Practice Type 1, per the resolved mapping); course
     subgrid (Education Institution, AEI Programme Title, Training Type Code,
     Programme Code, Academic Level) with "Add Courses" button and per-row
     edit/delete; the sole remaining course row's delete control is disabled/absent.
   - **AuthorisedSignatoriesFirstPage_ViewAudits.png**: Modified On, Name, Old
     Value, New Value, Modified By, numbered pagination.
   - **AuthorisedSignatories_AddNewSignatories0.png /
     ..._AddNewSignatories1.png**: PIN + Surname fields, inline mismatch error
     text, Submit / Return to Summary buttons.
   - **AuthorisedSignatories_AddNewSignatories_AddCourse.png**: same static-field
     layout as View Details (values shown as inherited/read-only), "Add Courses"
     button, course subgrid with **no** remove control anywhere (add-only flow).
   - **CourseLookupRecords.png**: modal titled "Lookup records" with an X close
     control, decorative Search box, columns Select/Programme Title/Training Type
     Code/Programme Code/Academic Level/Qualification Route (the last showing the
     descriptive qualification-level text), numbered pagination, Add/Cancel
     buttons; confirm the Select column behaves as single-select (checking a new
     row visibly unchecks the previously checked one).
5. Confirm the landing page's "Manage approved signatories" tile is still
   unlinked at this point (wiring happens in Phase 3 per the plan, verify in
   Phase 4's click-through instead if wiring lands later than page-building).

## Phase 4 - Integration (full click-through, backend + frontend together)

Run the single-port app with a freshly reset DB.

1. **Landing page**: click "Manage approved signatories" -> lands on
   `/authorised-signatories` with the Active Signatories subgrid showing real data
   (16 rows from `GET /api/signatories?active=Yes`).
2. **Toggle**: flip to "Inactive Signatories" -> subgrid re-renders in place (no
   navigation - URL/page stays the same) showing 8 rows; flip back -> 16 rows
   again.
3. **View Details** (click on `26H0401Z`'s row): static fields match the CSV;
   course subgrid shows exactly 1 row; "Add Courses" opens the Course Lookup
   pop-up scoped to institute 1315 (8 combos); check one row, then check a
   different row - confirm the first unchecks (single-select); click Add -> modal
   closes, course subgrid now shows 2 rows, and the new row's Training Type
   Code/Programme Code match what was picked (not swapped, per the resolved
   mapping).
4. **Remove Course**: on the same applicant (now 2 courses), remove one -> subgrid
   drops to 1 row; confirm the remaining sole row's remove control is now
   disabled/hidden.
5. **View Audits**: from the row action drop-down, View Audits for `26H0401Z` ->
   shows the add/remove entries from steps 3-4, Old/New values genuinely
   different, newest first.
6. **Add a Signatory - success path**: from First Page, "Add new signatory" ->
   enter PIN `26H0401Z` / surname `Young` -> Submit -> lands on the Add Course
   detail page with the same static fields and course subgrid as View Details
   (add-only, no remove control) -> Add Courses -> pick a combo -> course subgrid
   grows by one row -> confirm this new course is now also visible when you
   navigate back to First Page -> View Details for `26H0401Z`.
7. **Add a Signatory - mismatch paths**: (a) PIN `26H0401Z` + wrong surname ->
   inline mismatch error, no navigation; (b) PIN `26H0417Z` (inactive) + surname
   `Young` -> also treated as no match (active-only), same inline error.
8. Confirm none of the above affected the Upload module - spot check
   `/select-institute` still lists the 2 institutes and Upload Summary still shows
   prior upload batches unchanged.

## Phase 5 - System Testing & Validation

Formal full pass, plus edge cases not necessarily hit above:

- **Data parity**: Active count 16 / Inactive count 8, matching the CSV exactly;
  spot-check 2-3 rows' Approved course title (e.g. `26H0401Z` -> `RAN1`, no
  separator), Practice Type, and Register Part rendering against both the CSV and
  the diagrams.
- **Capacity edge**: fill an applicant to all 5 course slots (course 1 + 4 added)
  -> confirm "Add Courses" becomes disabled/hidden, or the pop-up's Add is
  rejected with a clear message - whichever the UI implements, it must not allow a
  6th course or silently overwrite an existing slot.
- **Sole-course protection**: confirm remove is blocked at exactly 1 remaining
  course for every applicant tested, not just the seed data's single-course ones.
- **Inactive applicant course edits**: on an inactive applicant's View Details,
  confirm Add Course and Remove Course still function per spec (both allowed),
  but "Remove Signatory" is absent from that row's action menu on First Page.
- **Course Lookup pop-up**: institute-scoping (only 1315's 8 combos ever appear
  for our seed data - no other institute's programmes), single-select behaviour,
  Qualification Route showing descriptive text not a code letter, numbered
  pagination control present (expected to show just page 1 at this data volume).
- **Cross-check every page against its diagram** one more time for layout/field
  parity and spacing consistency with the Upload module's pages.
- **Regression**: `cd backend && uv run pytest -v` and `cd frontend && npm test`
  both fully green, including every pre-existing Upload-module test - this module
  must not have touched `programmes`/`master_students`/upload logic.

## Phase 6 - Polish

- One more full click-through of every Authorized Signatory page, purely looking
  for spacing/alignment drift against the Upload module's pages.
- Confirm no 'NMC' branding anywhere in this module either, no header/footer
  links, and the AEI/Name/PIN search boxes stay decorative.
- Reset the demo database (delete the SQLite file, or the existing
  `app.scripts.reset_db` command once extended per the plan) and confirm
  `master_applicants` reloads to 24 rows (16/8 active/inactive) and
  `audit_records` is empty again - proving the whole demo, both modules, resets
  cleanly before a live demonstration.
