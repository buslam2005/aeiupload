# Authorized Signatory - Development Plan (Execution Log)

This file tracks actual progress against `developmentplan_AS.md`. The plan content
below is duplicated from that file; status notes and deviations are appended per
phase as work completes - same convention as `developmentplan_execution.md` for the
Upload module.

## Scope

In scope (this plan): the **Authorized Signatory** module - a second, independent
branch of the AEI Portal alongside AEI Student Upload. Covers:

- Authorised Signatories First Page (Active/Inactive Signatories toggle)
- View Details (course subgrid, Add Course, Remove Course)
- View Audits
- Add a Signatory (PIN + Surname match -> Add Course detail page)
- Course Lookup Records pop-up (shared by View Details and Add Signatory)
- Wiring the existing "Manage approved signatories" landing-page tile to this module

Out of scope (unchanged from module 1's plan): no authentication, not responsive,
no NMC branding (replace with "Prototype"), no header/footer links, runs at
`localhost:8008`, buildable for a restricted-access cloud host later. "Search
Signatories" and the AEI/Name/PIN filter boxes stay decorative/non-functional, same
convention as "Advanced Search"/"Search" in the Upload module. "Remove Signatory" is
a dead link (no deletion), per `requirements.md`.

## Requirement Clarifications Resolved (via new diagrams + your decision)

`UI_requirements.md`'s prose contains a few internal inconsistencies that the newly
added diagrams (`requirement_doc/diagrams/AuthorisedSignatories*.png`) resolve with
visual evidence. Recorded here so the discrepancy in the doc text doesn't get
re-implemented literally:

1. **Register Part / Practice Type** - the View Details page text has these swapped
   relative to the First Page subgrid text. The `AuthorisedSignatoriesFirstPage_ViewDetails.png`
   diagram shows the *same* applicant ("Sai P") with Register Part = 3 tags
   (Nursing/Midwifery/SCPHN) and Practice Type = 1 tag (Nursing), matching the First
   Page row for that applicant exactly. **Resolution: every page uses Register
   Part <- `nmc_registerpart1-3`, Practice Type <- `nmc_practicetype1-3`,
   consistently.**
2. **Course subgrid "Training Type Code" / "Programme Code"** - the doc text maps
   these to `nmc_trainingtype` (a field that doesn't exist on `master applicants`)
   and a duplicated `nmc_trainingtypecode`. The View Details diagram shows Training
   Type Code = "R", Programme Code = "AN" for a De Montfort/Adult Nursing row, which
   only makes sense as `nmc_trainingtypecode` / `nmc_programmecode` (or the matching
   `nmc_courseXtrainingtypecode` / `nmc_courseXprogrammecode` for added courses).
   **Resolution: Training Type Code <- course's `..trainingtypecode`, Programme
   Code <- course's `..programmecode`.**
3. **View Audits "New Value"** - doc text maps both Old Value and New Value to
   `nmc_previousvalue`. The `AuthorisedSignatoriesFirstPage_ViewAudits.png` diagram
   shows visibly different Old/New values per row (e.g. blank -> "RAN").
   **Resolution: New Value <- `nmc_newvalue`.**
4. **"Approved course title" concatenation** - text doesn't state a separator. The
   First Page diagram shows the value "RAN" for a trainingtypecode="R"/
   programmecode="AN" row. **Resolution: direct concatenation, no separator
   (`nmc_trainingtypecode + nmc_programmecode`).**
5. **Course Lookup Records pop-up capacity** - no diagram exists for this pop-up.
   Per your decision: **the row checkbox is single-select** - checking a new row
   unchecks the previously checked one, so a user adds one course per pop-up visit
   and the "more selected than remaining slots" case never arises.

## Assumptions (confirmed by you, 2026-08-28)

- **`nmc_pin` is the primary key** of `master applicants`, mirroring how
  `nmc_nmcpin` is the PK of `master students` (each PIN is unique in the sample
  data).
- **Course row 1 mirrors the top-level course fields.** The sample CSV confirms
  `nmc_course1trainingtypecode/programmecode/academiclevel/qualificationroute`
  always equal the top-level `nmc_trainingtypecode/programmecode/academiclevel/
  qualificationroute` on every row. So the course subgrid always shows course 1 as
  the originally-linked course (mirrored from the top-level fields at data
  creation), and "Add Course" fills course 2, then 3, 4, 5 - matching
  `requirements.md`'s own worked example ("...inserted into corresponding
  nmc_course2... fields") and the "Maximum 4 additional courses" cap (slots 2-5).
- **"Education Institution" and "AEI Programme Title" in the course subgrid are
  resolved at display time, not stored per course slot.** `master applicants` has
  no `nmc_courseXinstitutename` or `nmc_courseXaeiprogrammetitle` columns - only
  `nmc_institutename`/`nmc_aeiprogrammetitle` at the top level, and Add Course only
  writes training type/programme/academic level/qualification route into the
  `courseX` fields (per `requirements.md`'s worked example). So: Education
  Institution is always the applicant's own `nmc_institutename` (all courses belong
  to that institute); AEI Programme Title per row is looked up from `programmes` by
  matching that course's institute code + training type + programme + academic
  route.
- **"Active programmes" in the Course Lookup pop-up** = all `programmes` rows for
  the applicant's home institute. The `programmes` table has no active/inactive
  flag (same as the Upload module, which has no such filter either), so "active" is
  read as "the current seeded programme catalogue," not an extra flag to add.
- **CSV column-name typos are a data-file issue, not a schema issue.**
  `masterapplicants.csv`'s header has `mc_qualificationroute` (missing leading `n`)
  for the top-level column and all 5 `courseX` variants. `database_requirements.md`
  spells these `nmc_qualificationroute` / `nmc_courseXqualificationroute`
  correctly. The seed loader will map the misspelled CSV headers onto the correctly
  named model columns (evidence: 6 occurrences, always missing the same leading
  `n`, everywhere else in the file `nmc_` is spelled correctly).
- **No date transform needed.** Unlike `master students` (`YYYYMMDD`),
  `nmc_regexpirydate`/`nmc_createdon` in the sample CSV are already `DD/MM/YYYY`
  strings, matching what the diagrams display verbatim (e.g. "16/09/2025"). Stored
  and displayed as-is.
- **Active/Inactive toggle is one page, not two routes.** The two diagrams
  (`AuthorisedSignatoriesFirstPage.png` / `..._InactiveSignatories.png`) are the two
  states of one page with client-side toggle, matching the "flip the toggle" wording
  in both `requirements.md` and `UI_requirements.md`. Flipping the toggle re-queries
  and re-renders the subgrid underneath it only - the user stays on the same page,
  no navigation.
- **View Details and View Audits are single reusable routes**, parameterised by PIN,
  since both explicitly serve active and inactive applicants identically per the
  doc ("also navigated from the subgrid of ... Inactive Signatories").
- **Course Lookup Records pop-up** - now covered by `CourseLookupRecords.png`
  (added to `requirement_doc/diagrams/`). Confirmed layout, superseding the earlier
  no-diagram assumption:
  - Modal titled "Lookup records", with an "X" close control top-right.
  - A decorative Search box + icon above the table (non-functional, same convention
    as the other search boxes in this module).
  - Table columns: **Select** (checkbox), **Programme Title** (`nmc_programmename`),
    **Training Type Code** (`nmc_trainingtype`), **Programme Code**
    (`nmc_programme`), **Academic Level** (`nmc_academicroute`), **Qualification
    Route** (`nmc_qualificationlevelname` - the descriptive text, e.g. "Full Time"/
    "Part Time"/"Apprenticeship", not the raw `nmc_qualificationlevel` code letter;
    the column is labelled "Qualification Route" in the diagram even though it
    sources from the qualification-level field, not `nmc_academicroute` which is
    already used for Academic Level).
  - **Numbered pagination** at bottom-left (e.g. "1 2 3 4"), not infinite scroll -
    matches `AuthorisedSignatoriesFirstPage_ViewAudits.png`'s pagination style, not
    the Upload Result subgrids' infinite scroll. With our seed data (8 combos for
    institute 1315) this will typically render as a single page - render the
    control but it's fine if it only ever shows page 1 in the demo.
  - **Add** (primary/magenta) and **Cancel** buttons bottom-right.
  - Selection stays **single-select** per your prior decision (visually a checkbox,
    behaviourally checking a new row unchecks the previous one) - the reference
    diagram's own sample rows are generic NMC production data unrelated to our seed
    catalogue, so it doesn't itself resolve the multi-select-capacity question; your
    decision stands.
- **Audit table name**: modelled as `audit_records` (the requirement doc just says
  "table: audit tables"); no FK constraint to `master_applicants.nmc_pin` (keeps
  seeding/removal simple, consistent with "do not program defensively" - there is
  no delete path for `master_applicants` rows in this module).

## Data Model Additions (`database_requirements.md`)

### `master_applicants`
All columns listed in `database_requirements.md`, keyed by `nmc_pin`. Pre-populated
from `requirement_doc/sample_data/masterapplicants.csv` at table creation (24 rows:
16 `nmc_active = Yes`, 8 `= No`, all institute 1315 in the sample data), with the
CSV header typo mapped as noted above.

### `audit_records`
Surrogate integer PK + all columns from `database_requirements.md`
(`nmc_pin, nmc_lastname, nmc_firstname, nmc_regexpirydate, nmc_addedby,
nmc_modifiedon, nmc_attributechanged, nmc_previousvalue, nmc_newvalue`). Empty at
startup - populated only by Add Course / Remove Course actions during use.

## Backend Logic Additions

- **Lookups**: reuse/extend the existing `programmes` lookup (`routers/lookups.py`)
  with a course-choice endpoint returning the 5 fields the Course Lookup pop-up
  needs (`nmc_programmename, nmc_trainingtype, nmc_programme, nmc_academicroute,
  nmc_qualificationlevelname`, the last shown under the pop-up's "Qualification
  Route" column) filtered by institute code - the existing `ProgrammeChoiceOut` is
  close but missing qualification level name, so add a sibling schema/endpoint
  rather than overload the upload module's.
- **Signatories list**: endpoint returning `master_applicants` filtered by
  `nmc_active` (Yes/No), for the First Page subgrid.
- **View Details**: endpoint returning one applicant's static fields + its populated
  course rows (course 1 through the first empty slot), with Education
  Institution/AEI Programme Title resolved via the `programmes` join described
  above.
- **Add Course**: given a PIN + a single chosen programme combination, find the
  first empty `courseX` slot (2 through 5; reject if none free - all 5 slots used),
  write the 4 fields into it, and append one `audit_records` row
  (`nmc_attributechanged='Approved Course'`, `nmc_previousvalue=''`,
  `nmc_newvalue=<trainingtypecode><programmecode>` concatenation, no separator, per
  the resolved "Approved course title" convention).
- **Remove Course**: given a PIN + course slot number, reject if it's the only
  populated slot; otherwise purge that slot's 4 fields and append one
  `audit_records` row (`nmc_previousvalue=<concat>`, `nmc_newvalue=''`). Not exposed
  for the Add-Signatory flow (add-only, per spec).
- **Add Signatory match**: given PIN + surname, look up `master_applicants` where
  `nmc_active='Yes'`; match requires both PIN and surname to agree with the same
  row (case-sensitivity: exact match, consistent with how the Upload module matches
  master data). No match -> the mismatch message shown under the textbox (exact
  wording to confirm against the diagram at build time); match -> return the
  applicant's static fields + course rows for the Add Course detail page, reusing
  the Add Course logic above (max slots 2-5, no remove).
- **View Audits**: endpoint returning `audit_records` for a PIN, sorted by
  `nmc_modifiedon`.
- Unit tests (pytest) for: seed row counts/spot-checks, add-course slot selection
  (first empty of 2-5), add-course when all 5 full (rejected), remove-course when 1
  left (rejected), remove-course purge + audit content, add-course audit content,
  PIN+surname match (active only - a valid PIN with `nmc_active='No'` must not
  match), and the institute-scoped course-lookup query.

## Frontend Additions

New routes (kebab-case, consistent with the existing `upload-*`/`view-details`
routes):

```
frontend/app/
  authorised-signatories/
    page.tsx                     # First Page: Active/Inactive toggle + subgrid
    view-details/page.tsx        # ?pin=... - static fields + course subgrid
    view-audits/page.tsx         # ?pin=... - paginated audit subgrid
    add-signatory/
      page.tsx                   # step 1: PIN + Surname match
      detail/page.tsx            # step 2: Add Course detail (post-match)
  components/
    CourseLookupModal.tsx        # shared pop-up: institute-scoped, single-select
    TagList.tsx                  # Register Part / Practice Type chip display
```

Reuse from the Upload module: `PageShell`, `PageFooter`, `buttonStyles`, subgrid/
icon patterns from `ErrorRecordsSubgrid.tsx`, and the typed `apiFetch` wrapper in
`lib/api.ts` (extended with the new signatory endpoints and matching types in
`lib/types.ts`).

Landing page: add an `href` for the "Manage approved signatories" tile in
`frontend/app/page.tsx` (currently href-less per the Phase-1-8 note in that file),
pointing at `/authorised-signatories`.

## Development Phases

### Phase 1 - Data Model

**Status: Complete (2026-08-28), manually verified by requester (2026-08-28)**

- `backend/app/models.py` - two new SQLModel tables:
  - `MasterApplicant` (`master_applicants`) - all 39 columns from
    `database_requirements.md`, keyed by `nmc_pin` (confirmed unique across all 24
    seed rows before committing to this, same evidence-first approach as
    `MasterStudent.nmc_nmcpin` in Phase 2 of the Upload module). Fields verified
    always-populated in the seed data are declared required (`nmc_pin`,
    `nmc_lastname`, `nmc_firstname`, `nmc_regexpirydate`, `nmc_addedby`,
    `nmc_createdon`, `nmc_institutecode`, `nmc_institutename`,
    `nmc_aeiprogrammetitle`, `nmc_trainingtypecode`, `nmc_programmecode`,
    `nmc_academiclevel`, `nmc_qualificationroute`, `nmc_registerpart1`,
    `nmc_active`, and all four `nmc_course1...` fields); fields verified blank on
    at least one seed row are declared optional (`nmc_registerpart2/3`,
    `nmc_practicetype1/2/3`, and all sixteen `nmc_course2...`-`nmc_course5...`
    fields - courses 2-5 are blank on every seed row, populated only at runtime by
    Add Course).
  - `AuditRecord` (`audit_records`) - surrogate integer PK + the 9 columns from
    `database_requirements.md`. No FK to `master_applicants.nmc_pin`, per the
    plan's Assumption ("keeps seeding/removal simple... no delete path for
    `master_applicants` rows in this module").
- `backend/app/seed_data/masterapplicants.csv` - backend-owned copy of
  `requirement_doc/sample_data/masterapplicants.csv`, same convention as the two
  existing seed CSVs (confirmed byte-identical via `diff` before and after copy).
- `backend/app/db.py`:
  - `_MASTER_APPLICANTS_HEADER_FIXES` - a module-level remap dict fixing the
    source CSV's header typo (`mc_qualificationroute` -> `nmc_qualificationroute`,
    and the same miss-spelling on all 5 `courseX` variants - 6 occurrences total,
    confirmed by inspecting the CSV header row directly rather than guessing).
  - `_seed_master_applicants(session)` - same idempotent pattern as the two
    existing seed functions (early-return if the table already has a row),
    applying the header remap per CSV row before constructing each
    `MasterApplicant`.
  - `create_db_and_tables()` now also calls `_seed_master_applicants(session)`.
    `audit_records` is never seeded (no seed function needed - `create_all`
    creates the empty table, matching `upload_batches`/`upload_students`' pattern
    from Phase 2 of the Upload module).
- `backend/tests/test_as1_database.py` - 9 new tests: row count (24), active/
  inactive split (16/8), idempotent double-seed, a CSV spot-check against
  `26H0401Z`, the header-typo remap (asserts `nmc_qualificationroute == "F"` and
  that no `mc_qualificationroute` attribute exists), course-1-mirrors-top-level
  fields, courses 2-5 blank in seed data, the `26H0417Z` inactive-PIN fixture
  (reserved for later Add-Signatory mismatch tests in Phase 2), and
  `audit_records` starting empty.

**Troubleshooting / findings (with evidence):** none - Phase 1 was a direct,
mechanical extension of the existing seeding pattern (two prior tables already
established the shape: model with typed columns, seed CSV copy, idempotent seed
function, seed call in `create_db_and_tables()`). The one real, evidenced decision
was the CSV header-typo remap, confirmed by inspecting the raw header row of
`masterapplicants.csv` before writing the fix (6 occurrences of
`mc_qualificationroute`, always missing the same leading `n`, with every other
`nmc_` column spelled correctly) - proven with a dedicated test
(`test_qualification_route_header_typo_is_remapped`) rather than assumed fixed.

**Verification performed:**
- `backend/tests/test_as1_database.py` (9 new tests) + the full existing suite:
  **82/82 pass** (9 new + 73 pre-existing Upload-module tests unchanged - confirms
  this phase touched nothing `programmes`/`master_students`/upload-related).
- Live-server pass: fresh `uv run uvicorn app.main:app --port 8009` against a
  deleted `data/` directory, `GET /api/health` -> `{"status":"ok"}`, counts
  checked independently via the `sqlite3` CLI (not just the app's own ORM):
  `master_applicants` 24 (16 active / 8 inactive), `audit_records` 0. Restarted
  the same server against the existing DB file (no delete) - `master_applicants`
  count unchanged at 24, confirming idempotent seeding outside of pytest too, not
  just in the in-memory test fixture.
- **Manual test: complete (2026-08-28)** - requester ran the Phase 1 section of
  `manual_testing_guideAS.md` and confirmed all cases pass.

**Deliverable state:** Phase 1 signed off. Ready to proceed to Phase 2 (Backend
Logic).

### Phase 2 - Backend Logic

**Status: Complete (2026-08-29), manually verified by requester (2026-08-29)**

- `backend/app/schemas.py` - added `CourseChoiceOut`, `SignatoryListItemOut`,
  `CourseRowOut`, `SignatoryDetailOut`, `AddCourseRequest`, `MatchRequest`,
  `AuditRecordOut`.
- `backend/app/services/signatories.py` (new) - slot selection
  (`first_empty_add_slot`, scans 2-5 only, per Assumption 2 Add Course never
  touches slot 1), `add_course`/`remove_course` (field writes/purge +
  `AuditRecord` construction, raising `ValueError` on capacity/sole-course
  violations for the router to translate to 409), `match_applicant`
  (active-only, exact PIN + surname match), `register_parts`/`practice_types`
  (blank-filtering the 1-3 slots), `course_concat`.
- `backend/app/services/programmes.py` - added `list_course_choices`
  (institute-scoped, all qualification-level variants kept distinct - unlike
  `list_programme_choices`) and `resolve_course_title` (institute + training
  type + programme + academic route + **qualification level**).
- `backend/app/routers/signatories.py` (new) - `GET /signatories`,
  `GET /signatories/{pin}`, `GET /signatories/{pin}/audit`,
  `POST /signatories/{pin}/courses`, `DELETE /signatories/{pin}/courses/{slot}`,
  `POST /signatories/match`; mounted in `main.py` under `/api`.
- `backend/app/routers/lookups.py` - added `GET /course-choices`, per the
  plan's note to extend the existing lookups router rather than overload the
  upload module's `ProgrammeChoiceOut`.
- `backend/tests/conftest.py` - `client` fixture now also seeds
  `master_applicants`, needed for the new API-level tests.
- `backend/tests/test_as2_backend.py` - 24 new tests (API-level, via
  `TestClient`): list counts/tags, view-details course rows + title
  resolution, course-choices institute-scoping, add-course slot ordering,
  capacity rejection (409), remove-course sole-course rejection (409), audit
  content for both add and remove, and all three Add-Signatory match cases
  (valid, inactive-PIN, surname-mismatch).

**Troubleshooting / findings (with evidence):** the plan's course-title
lookup assumption specified matching on "institute code + training type +
programme + academic route" (3 dimensions, no qualification level). Proved
this ambiguous before implementing it as written: institute 1315's own seed
data (`AEI_programmes.csv`) has pairs sharing all three of those (e.g.
`SC1`/`B Nurs (Hons)`, `AN1`/`B Nurs (Hons)`) that differ only by
qualification level, each with a different `nmc_aeiprogrammetitle`
("BN (Hons) Children's Nursing" vs "...Apprenticeship"). Matching on only 3
dimensions would have made `resolve_course_title` pick whichever row loaded
first, silently returning the wrong title depending on CSV row order.
**Root cause: the plan's shorthand omitted qualification level, which the
data itself requires to disambiguate.** Fixed by including qualification
level in the join and added a dedicated test
(`test_view_details_disambiguates_title_by_qualification_level`) proving both
variants resolve to their correct, distinct titles.

**Verification performed:**
- `backend/tests/test_as2_backend.py` (24 new tests) + the full existing
  suite: **99/99 pass** (24 new + 75 pre-existing Upload-module and Phase 1
  AS tests unchanged - confirms this phase touched nothing
  `programmes`/`master_students`/upload-related).
- Live-server pass: fresh `uv run uvicorn app.main:app --port 8009` against a
  deleted `data/` directory, working through
  `manual_testing_guideAS.md`'s Phase 2 curl sequence verbatim (steps 2-9):
  signatories list (16/8), view details for `26H0401Z` (1 course row,
  resolved title), course-choices for institute 1315 (8 entries), add course
  (`RSC1` audit new-value), fill slots 2-5 then confirm the 6th add is
  rejected with 409 (not silently ignored or overwriting a slot), sole-course
  removal rejected with 409, a real removal purging the slot and writing
  `RSC1 -> ''` to the audit trail, and all three Add Signatory match
  outcomes (match / inactive-PIN no-match / surname-mismatch no-match) -
  every response matched the guide's expected values exactly. Restarted the
  server against the existing DB file (no delete) and confirmed the 4
  courses from the curl session persisted (no re-seed), matching Phase 1's
  idempotent-seeding behaviour.
- **Manual test: complete (2026-08-29)** - requester ran the Phase 2 section
  of `manual_testing_guideAS.md` and confirmed all cases pass.

**Deliverable state:** Phase 2 signed off. Ready to proceed to Phase 3 (UI
Development).

### Phase 3 - UI Development
Build each page from `UI_requirements.md`'s Authorized Signatories section and its
named diagram, matching the resolved field mappings above and the existing pages'
spacing/colour conventions.

- **Authorised Signatories First Page**: 3 decorative filter drop-downs + disabled
  Search Signatories button, Active/Inactive toggle, subgrid (Name, Approved course
  title, Practice Type, Register Part, Registration expiry date, Date Created, By
  Who, View Details, View Audits, Remove Signatory [Active only, dead link]), "Add
  new signatory" button.
- **View Details**: static field block (NMC PIN, Surname, Full Name, Registration
  Expiry Date, Added By, AEI, Created On, Register Part tags, Practice Type tags),
  course subgrid with Add Courses / per-row Edit-link / per-row Remove-link, "1
  course cannot be removed" enforced in the UI (disable/hide Remove on the sole
  row).
- **View Audits**: Modified On / Name / Old Value / New Value / Modified By,
  paginated.
- **Add a Signatory (step 1)**: PIN + Surname fields, inline mismatch error, Submit
  / Return to Summary.
- **Add a Signatory (step 2)**: same static-field layout as View Details (values
  inherited from step 1's match), Add Courses button, course subgrid grows as
  courses are added, no remove control.
- **Course Lookup Records pop-up** (per `CourseLookupRecords.png`): modal titled
  "Lookup records" with an X close control, decorative Search box, numbered-page
  subgrid (Programme Title, Training Type Code, Programme Code, Academic Level,
  Qualification Route - the last showing `nmc_qualificationlevelname`),
  single-select checkbox, Add/Cancel buttons - reused by both View Details and Add
  Signatory step 2.
- Landing page tile wiring.

**Status: Complete (2026-08-29), manually verified by requester (2026-08-29)**

- `frontend/app/lib/types.ts` - added `CourseChoice`, `SignatoryListItem`,
  `CourseRow`, `SignatoryDetail`, `AuditRecordEntry`, mirroring
  `backend/app/schemas.py` exactly (same convention as the Upload module's
  types.ts) so Phase 4 can swap mock data for real `fetch()` calls without
  renaming any field.
- `frontend/app/authorised-signatories/mockData.ts` (new) - Phase 3 fixtures
  shaped like the real Phase 2 responses: `MOCK_COURSE_CHOICES` (institute
  1315's real 8-combo catalogue, copied verbatim from the seed CSV),
  `MOCK_SIGNATORY_DETAILS`/`MOCK_SIGNATORIES` (8 self-authored signatories,
  active and inactive, including a "Sai P" fixture matching the View Details
  diagram's 3-tag Register Part / 1-tag Practice Type example, and two
  intentionally-unresolvable course combos to prove the UI's null-title
  fallback), `MOCK_AUDITS` (one PIN with 7 rows to exercise real
  pagination), plus pure helper functions mirroring the backend services
  (`firstEmptyAddSlot`, `courseFromChoice`, `resolveCourseTitle`,
  `matchSignatory`) so the mock add/remove/match logic matches
  `backend/app/services/signatories.py`'s behaviour exactly.
- New routes: `authorised-signatories/page.tsx` (First Page - toggle,
  filters, subgrid, per-row actions dropdown), `.../view-details/page.tsx`,
  `.../view-audits/page.tsx` (paginated), `.../add-signatory/page.tsx` (step
  1 - PIN+Surname match) and `.../add-signatory/detail/page.tsx` (step 2 -
  add-only).
- New shared components: `TagList.tsx` (chip display), `CourseSubgrid.tsx`
  (Remove omitted entirely when not passed an `onRemove`, so Add Signatory
  step 2 is structurally add-only rather than relying on a disabled button),
  `SignatoryStaticFields.tsx` (the field block shared by View Details and Add
  Signatory step 2), `CourseLookupModal.tsx` (single-select, working numbered
  pagination at 5 rows/page).
- `frontend/app/lib/format.ts` - added `signatoryNameLabel`.
- `frontend/app/page.tsx` - "Manage approved signatories" tile now links to
  `/authorised-signatories`; `page.test.tsx` updated to match.
- Tests: `authorised-signatories/page.test.tsx`,
  `view-details/page.test.tsx`, `view-audits/page.test.tsx`,
  `add-signatory/page.test.tsx`, `add-signatory/detail/page.test.tsx`,
  `components/CourseLookupModal.test.tsx` - 88 tests total across the
  frontend suite (17 files).

**Troubleshooting / findings (with evidence):**
- **No "Edit Course" action.** `UI_requirements.md`'s course subgrid lists a
  "link to Edit Course page" alongside "link to delete the course record",
  and the dev plan's own Phase 3 bullet echoes "per-row Edit-link". Checked
  the backend before building this: Phase 2 only exposes add-to-next-slot
  and remove-a-slot endpoints - there is no edit-in-place endpoint, and the
  diagrams themselves only show a generic chevron per row, never two
  distinct actions. Built `CourseSubgrid.tsx` with only a Remove action
  (commented with this reasoning in the component) rather than adding a
  dead "Edit" link with nothing behind it.
- **ESLint `react-hooks/set-state-in-effect` on `CourseLookupModal`.** First
  draft reset the pop-up's selection/page state in a `useEffect` keyed on the
  `open` prop, so reopening it wouldn't show a stale selection. Root cause:
  using an effect to reset state the component's own mount lifecycle already
  resets for free. Fixed by splitting the modal so its stateful content only
  mounts while `open` is true (`if (!open) return null` before the stateful
  child renders) - state now initializes fresh on every open with no effect
  needed.
- **`page.test.tsx`'s `push` mock leaking between tests.** Two new
  `AddSignatoryPage` tests failed because an earlier test's successful
  `router.push` call was still recorded when a later test asserted
  `push` was never called. Root cause: the mock `vi.fn()` wasn't cleared
  between tests (missing `afterEach(() => vi.clearAllMocks())`, present in
  other test files but omitted here initially) - added it, both tests pass.

**Verification performed:**
- `cd frontend && npm run lint` - clean.
- `npm test` - **88/88 pass** (17 test files, 0 regressions in the
  pre-existing Upload-module frontend tests).
- `npm run build` - static export succeeds; all 5 new routes prerendered
  (`/authorised-signatories`, `.../view-details`, `.../view-audits`,
  `.../add-signatory`, `.../add-signatory/detail`), TypeScript clean.
- `cd backend && uv run pytest` - **99/99 pass**, confirming this
  frontend-only phase touched nothing backend-side.
- Live browser walkthrough (Playwright, against the built static export
  served by the real backend) of every diagram: First Page data + row
  actions dropdown, Active/Inactive toggle re-rendering in place, View
  Details (tag chips matching the "Sai P" reference, course subgrid,
  Add Courses -> Course Lookup pop-up -> row appended with the correctly
  resolved AEI Programme Title), Course Lookup pop-up (single-select,
  working 2-page pagination for the 8 institute-1315 combos), View Audits
  (pagination, genuinely distinct Old/New values, newest first), Add
  Signatory mismatch (inactive PIN + correct surname correctly rejected)
  and success path (navigates to the add-only detail page with inherited
  fields, no Remove control anywhere), and Inactive Signatories toggle -
  every page matched its diagram.
- **Manual test: complete (2026-08-29)** - requester ran the Phase 3 section
  of `manual_testing_guideAS.md` and confirmed all cases pass.

**Deliverable state:** Phase 3 signed off. Ready to proceed to Phase 4
(Integration).

### Phase 4 - Integration
- Wire every page to its backend endpoint via the typed API client.
- Full navigation: Landing Page tile -> First Page -> (View Details -> Add/Remove
  Course -> back to First Page with updated row) and (Add Signatory step 1 -> step
  2 -> Add Course -> back to First Page), plus View Audits as a side branch from
  either subgrid state.
- Confirm the Active/Inactive toggle re-queries/re-renders without a full page
  navigation, and that a course add/remove immediately reflects in the First Page
  subgrid's "Approved course title" cell on return.

### Phase 5 - System Testing & Validation
Manual, diagram-by-diagram walkthrough plus automated coverage, mirroring the
Upload module's Phase 6 approach:

- **Data parity**: First Page Active list = 16 rows, Inactive list = 8 rows,
  matching `masterapplicants.csv`; spot-check 2-3 rows' Approved course
  title/Practice Type/Register Part rendering against the CSV and the diagrams.
- **View Details parity**: for the "Sai P" sample row (or nearest equivalent in our
  seed data), confirm Register Part/Practice Type tag rendering and course subgrid
  Training Type Code/Programme Code match the resolved mapping (not the literal
  doc text).
- **Add Course**: add a course to an applicant with only course 1 populated ->
  course 2 fields populate, audit row written (`blank -> concat`), subgrid shows 2
  rows; repeat to fill all 5 slots; confirm the 6th add attempt is rejected/blocked
  in the UI.
- **Remove Course**: remove a non-sole course -> fields purged, audit row written
  (`concat -> blank`), subgrid shrinks by one row; confirm removal is blocked when
  only 1 course remains (control disabled or backend rejects).
- **Inactive applicant**: confirm Add/Remove Course still function per spec, and
  "Remove Signatory" is absent/disabled (never available for inactive rows, per
  `AuthorisedSignatoriesFirstPage_InactiveSignatories.png`'s column list).
- **Add a Signatory**: (a) valid active PIN+surname -> step 2 detail page with
  correct inherited fields; (b) mismatched PIN or surname -> inline error, no
  navigation; (c) a PIN belonging to an *inactive* applicant -> also treated as no
  match (active-only lookup); (d) add a course from step 2 -> audit row written,
  applicant now shows 2 courses back on the First Page.
- **View Audits**: confirm Old/New values are genuinely different per row and
  pagination works once more than one page of entries exists (generate several via
  repeated add/remove during testing).
- **Course Lookup pop-up**: confirms institute-scoping (only institute 1315's 8
  combos appear for our seed data), single-select behaviour (checking a new row
  unchecks the previous one), the Qualification Route column shows the descriptive
  qualification-level name (not the raw code letter), and the numbered pagination
  control renders correctly (page 1 only, expected at our seed data's scale).
- **Cross-check every page against its diagram** for layout/field parity and
  consistent spacing with the Upload module's pages.
- **Regression check**: confirm the Upload module (module 1) still passes its
  existing pytest suite and manual checklist unchanged - this module only adds
  tables/routes/pages, it doesn't touch `programmes`/`master_students`/upload
  logic.

### Phase 6 - Polish
- Final spacing/layout consistency pass across all Authorized Signatory pages and
  against the Upload module's pages.
- Confirm no NMC branding, header/footer links, or working Search/filter boxes.
- Extend the existing demo seed/reset scripts (from the Upload module's Phase 8) to
  also reset `master_applicants`/`audit_records`, so the whole demo database resets
  cleanly for repeat demonstrations of both modules.

## Branching

Per this repo's established workflow, branch fresh off `origin/main` before Phase 1
begins (the current branch, `error-records-revised-programme-4field`, belongs to the
prior Upload-module change and should be left alone/merged separately).

**Executed:** branched `authorised-signatory-module` fresh off `origin/main`
(2026-08-28) - the prior branch's PR (#12) was already merged, so this carried
forward the uncommitted Authorized Signatory requirement-doc edits, diagrams,
sample data, and planning docs cleanly, with no divergent history to reconcile.
