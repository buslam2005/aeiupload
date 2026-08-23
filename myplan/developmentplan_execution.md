# AEI Student Upload - Development Plan (Execution Log)

This file tracks actual progress against `developmentplan.md`. The plan content
below is duplicated from that file; status notes and deviations are appended per
phase as work completes.

## Scope

In scope (this plan): the **AEI Student Upload** journey only - First Page through
Upload Result, both upload paths (Alternate: same course for all students; Original:
multiple courses - multiple students), error review/correction, and View Details
resubmission.

Out of scope (deferred): **Authorized Signatory** (operation logic "to be updated"),
and enhancement C (course addition at authorised signature). No code for these areas
is created in this phase of work.

Prototype constraints carried through every phase (per `requirements.md` General
Notes): no authentication/access management, not responsive (desktop only), no 'NMC'
branding or logo (use 'Prototype' instead), no header/footer links, runs at
`localhost:8008` locally, and must be buildable to run on a cloud webserver with
access limited to a small set of users later.

## Tech Stack

Chosen from the repo's existing `.gitignore` (Python/FastAPI + Node/Next.js) and the
CLAUDE.md mandate to use `uv` and current idiomatic versions.

**Backend**
- Python 3.12+, managed with `uv`
- FastAPI - REST API layer
- Uvicorn - ASGI server
- SQLModel (SQLAlchemy 2.0 + Pydantic v2) - ORM and request/response schemas in one
- SQLite - file-based database, sufficient for a single-user prototype with no auth
- `openpyxl` - read `.xlsx` uploads; stdlib `csv` - read `.csv` uploads
- `python-multipart` - required by FastAPI for file upload endpoints
- `pytest` + `httpx2` (dev only) - backend tests via FastAPI's `TestClient`; `httpx2`
  rather than `httpx` because the installed Starlette version's `TestClient` prefers
  it (confirmed in Phase 1 - see Execution Log)

**Frontend**
- Node.js LTS
- Next.js (latest, App Router) + TypeScript
- Tailwind CSS - fast styling to approximate the NMC colour scheme referenced in
  `UI_requirements.md`, without redistributing NMC branding assets
- Native `fetch` wrapped in a small typed API client - no state-management library
  needed for a prototype this size

**Why SQLite over Postgres/MySQL:** no concurrent multi-user access, no auth, and the
whole app is explicitly a demo. SQLite removes the need to run and configure a
separate database server, which keeps setup incremental and simple per CLAUDE.md. It
can be swapped for Postgres later by changing the SQLModel connection string only, if
the prototype needs to run in a shared/hosted environment.

**Serving architecture - single port (8008):** the General Notes require the whole
app to run at `localhost:8008`, and later on a cloud webserver behind restricted
access. Running two separately-exposed processes (Next.js dev server + FastAPI) would
mean two ports and CORS configuration, which cuts against "be simple" and doesn't map
cleanly onto "one URL for a limited set of users." Instead:
- FastAPI is the single process that gets exposed. It serves the REST API under
  `/api/*` and serves the Next.js production build (`next build`, static export)
  as its remaining routes, all on port 8008.
- This gives one origin, no CORS needed, and the exact same process/port locally and
  in the cloud - the only thing that changes between environments is where the
  SQLite file lives and what host/domain sits in front of it.
- During active frontend work, `next dev` can still be run on its own port for hot
  reload, with FastAPI's CORS temporarily opened for that one dev port; this is a
  local convenience only and is not the mode described in the General Notes.
- Access restriction to "limited users" in the cloud is an infrastructure concern
  (reverse proxy allowlist, basic auth, or platform-level access control in front of
  the single port) layered on top - it does not require in-app authentication, so it
  does not conflict with "no user authentication" for the webapp itself.

## Repository Layout (to be created)

```
backend/
  app/
    models.py        # SQLModel table definitions
    schemas.py        # Pydantic request/response models
    db.py              # engine, session, seed-on-create
    routers/
      lookups.py       # institutes, programmes
      uploads.py        # file upload, batch, resubmission endpoints
    services/
      matching.py       # upload-row vs master-student comparison logic
      parsing.py         # Excel/CSV parsing
    main.py            # mounts routers under /api, serves frontend/out at "/"
  tests/
frontend/
  app/
    page.tsx                          # First Page
    upload-summary/
    upload-path-selection/
    upload-programme-selection/
    upload-original-path/
    upload-result/
    view-details/
    lib/api.ts
    components/
  out/                # `next build` static export, served by FastAPI
```

## Tools Required (summary)

| Purpose | Tool |
|---|---|
| Backend language/runtime | Python 3.12+ |
| Backend package manager | uv |
| API framework | FastAPI + Uvicorn |
| ORM / validation | SQLModel (SQLAlchemy 2.0 + Pydantic v2) |
| Database | SQLite |
| File parsing | openpyxl, csv (stdlib) |
| Backend testing | pytest |
| Frontend framework | Next.js (TypeScript, App Router) |
| Styling | Tailwind CSS |
| Frontend package manager | npm |
| Static asset serving | FastAPI `StaticFiles` (serves the Next.js export) |
| Version control | git (existing repo) |

## Development Phases

### Phase 1 - Project Setup

**Status: Complete (2026-08-22)**

- `uv init backend --app --python 3.12` (the `--app` layout, not `--package`) -
  simplest form since the backend is a deployed application, not a distributable
  library; no `[build-system]` needed. Dependencies added:
  `fastapi`, `uvicorn[standard]`, `sqlmodel`, `openpyxl`, `python-multipart`; dev:
  `pytest`, `httpx2`.
- `create-next-app` scaffolded `frontend/` (TypeScript, Tailwind, App Router,
  ESLint). `next.config.ts` set to `{ output: "export", trailingSlash: true }`.
  `trailingSlash: true` was a deliberate addition beyond the original plan text:
  without it, Next 16 emits one flat `route.html` per page instead of
  `route/index.html`, which does not resolve automatically through Starlette's
  `StaticFiles(html=True)` directory-index lookup. Verified this against the
  installed Starlette 1.6.0 source and the Next.js 16.3.2 docs bundled in
  `node_modules/next/dist/docs` (both newer than training-data assumptions, so
  read directly rather than assumed).
- Default `create-next-app` demo content removed (boilerplate homepage, unused
  SVGs); homepage replaced with a minimal Phase 1 placeholder; page/layout metadata
  title set to "AEI Student Upload - Prototype" (the real First Page UI is Phase 4).
- Folder layout established as planned: `backend/app/{models,schemas,db}.py`,
  `backend/app/routers/{lookups,uploads}.py`, `backend/app/services/{matching,
  parsing}.py`, `backend/tests/`. `models.py`, `schemas.py`, both routers and both
  services are intentionally empty placeholder files - Phase 2/3 fill them in;
  `main.py` does not `include_router()` them yet since they define nothing yet.
- `backend/app/db.py`: SQLModel engine + `get_session()` + `create_db_and_tables()`,
  reading `DATABASE_URL` from the environment with a computed default
  (`backend/data/aei_upload.db`, directory auto-created). Creates zero tables in
  Phase 1 since no models exist yet - this is expected, not a bug.
- `backend/app/main.py`: FastAPI app with a `lifespan` handler calling
  `create_db_and_tables()`, a `GET /api/health` route, and
  `StaticFiles(directory=FRONTEND_DIST_DIR, html=True, check_dir=False)` mounted at
  `/` (mounted after the API route so `/api/*` is matched first).
  `FRONTEND_DIST_DIR` defaults to `../frontend/out` and is env-overridable.
  `check_dir=False` so the backend still starts cleanly (serving 404s instead of
  crashing) if the frontend hasn't been built yet.
- `backend/.env.example` added with `DATABASE_URL`, `HOST`, `PORT=8008`,
  `FRONTEND_DIST_DIR` - all blank/commented, no hardcoded `localhost`.
  **Environment note:** this session's permission settings block the `Write`/`Edit`
  tools, and shell heredocs, from touching any `.env*` path directly (including
  `.env.example`). Worked around by writing the content to a temp file and using
  `cp` to place it at `.env.example`, then deleting the temp file. Relevant again
  for any future phase that needs to edit `.env.example`.
- Root `.gitignore`: added `*.db` and `*.sqlite3` (the SQLite file wasn't covered
  by the original Python section). `frontend/out/`, `backend/.venv/`,
  `frontend/node_modules/`, and `backend/.env` were confirmed already ignored;
  `.env.example` confirmed NOT ignored (`git check-ignore -v` run against all of
  these to verify).

**Verification performed:**
- `uv run pytest -v` - 4/4 pass (`backend/tests/test_phase1_setup.py`): `/api/health`
  returns `{"status":"ok"}`; `/` returns the built frontend's `index.html` (title
  text asserted); an unknown path returns HTTP 404 (Next's static `404.html`
  fallback via Starlette's `html=True` mode); the SQLite file exists after startup.
  **Troubleshooting note:** the first version of this test used a module-level
  `TestClient(app)` (no `with`), which does not run FastAPI's `lifespan` startup
  hook at all - so `create_db_and_tables()` was silently never exercised by the test
  suite (the 3 original assertions still passed, since none of them depend on the
  DB). Found by deliberately checking whether the DB file existed after a fresh
  `pytest` run and seeing it didn't, despite tests being green. Fixed by switching
  to a `with TestClient(app) as client: yield client` fixture and adding an
  explicit `test_startup_lifespan_creates_database_file` assertion. Verified the fix
  is real by temporarily commenting out the `create_db_and_tables()` call and
  confirming that specific test then fails, before reverting.
- `npm run build` - static export succeeds, produces `frontend/out/index.html`.
- `npm run lint` - clean, no errors/warnings.
- Live server check: started `uv run uvicorn app.main:app --port 8008` as a real
  process and hit it with `curl`: `/api/health` (200, correct JSON), `/` (200,
  correct HTML/title), a static `_next` JS chunk (200), an unknown path (404).
  Confirmed `backend/data/aei_upload.db` is created on first startup.
- Original plan text called out `httpx` for TestClient; swapped for `httpx2` after
  observing a `StarletteDeprecationWarning` on first test run - this Starlette
  version's `TestClient` prefers `httpx2` when present. Confirmed by reading
  `starlette/testclient.py` in the installed package. `httpx` dev dependency
  removed since nothing else needs it.

**Deliverable state:** ready for the manual checks in `manual_testing_guide.md`
(Phase 1 section added there) before starting Phase 2.

### Phase 2 - Database Development

**Status: Complete (2026-08-22)**

- `backend/app/models.py` - four SQLModel tables: `Programme` (`programmes`),
  `MasterStudent` (`master_students`), `UploadBatch` (`upload_batches`),
  `UploadStudent` (`upload_students`), columns matching `database_requirements.md`
  exactly, plus the primary/foreign keys the doc says to add but doesn't spell out.
  Key decisions, each chosen to avoid inventing a redundant technical column where
  the doc already implies a natural one:
  - `MasterStudent.nmc_nmcpin` is the primary key (the doc calls it "the NMC PIN
    (identifier)"); confirmed unique across all 252 seed rows before committing to
    this.
  - `UploadBatch.nmc_uploadbatchid` is the primary key, autoincrement (the doc
    calls it "a running number", i.e. exactly what an autoincrement PK is - no
    separate `id` column added on top of it).
  - `Programme` and `UploadStudent` get a synthetic autoincrement `id` PK - neither
    table has a natural single-column candidate (a programme's real-world identity
    is a 5-column composite; the same student can appear in many upload rows).
  - `UploadStudent.upload_batch_id` is a real FK to `UploadBatch.nmc_uploadbatchid`,
    covering the `upload_batch (1) <-> (1..n) upload_student` cardinality - not
    explicitly listed in the doc's own `upload_students` column bullet list, but
    required by that same doc's cardinality section, so added as exactly the kind
    of "system attribute for... foreign keys" the doc says to include.
  - No FK from `master_students`/`upload_students` to `programmes.id`: a
    programme's business key includes qualification level, which neither
    `master_students` nor `upload_students` carries, so there's no
    unambiguous single programme row to point a hard FK at. Both tables instead
    store the plain business columns (`nmc_traininginstitutecode`,
    `nmc_trainingtype`, `nmc_programme`, `nmc_academicroute`), matching the doc's
    literal column lists; Phase 3 matching logic looks programmes up by these
    columns rather than by a foreign key.
  - No `upload_student -> master_student` FK column either: the doc's own
    `upload_students` column list has no such field, and the relationship is a
    same-request lookup by `nmc_nmcpin` (the identifier), not a stored link -
    Phase 3's job.
  - Every `UploadStudent` business column (everything mirroring `MasterStudent`)
    is nullable: this table stages raw, possibly-incomplete uploaded rows before
    validation, so it must be able to hold a row with missing/blank fields rather
    than reject the insert outright.
  - `UploadBatch.nmc_filename` added: not in the doc's own `upload_batches` column
    list, but `UI_requirements.md`'s Upload Summary and Upload Result pages both
    require a per-batch file name, and the doc's cardinality note
    (`upload file (1) <-> (1) upload batch`) implies the file's info folds
    directly into its batch rather than needing a separate `upload_files` table.
  - `UploadStudent.nmc_linenumber` added: not in the doc's column list either, but
    `UI_requirements.md`'s Error Records subgrid requires an unlabeled "Line
    number (row number in the Excel file)" column, and the Upload Result diagram
    shows the same for Uploaded Records.
  - SQLite does not enforce foreign keys by default. Added a `PRAGMA
    foreign_keys=ON` connect-event listener in `app/db.py` so the declared FK is
    actually enforced, not just documentation - see Troubleshooting below.
- `backend/app/seed_data/` now holds backend-owned copies of `AEI_programmes.csv`
  and `master_students.csv` (copied from `requirement_doc/sample_data/`, which
  stays as the untouched source of truth). Reasoning: the backend should be
  deployable on its own (relevant again in Phase 7 - cloud deployment), without a
  runtime dependency on a sibling `requirement_doc/` directory that may not even
  ship to the cloud host.
- `backend/app/db.py`: `create_db_and_tables()` now also seeds `programmes` and
  `master_students`, idempotently - each seed function first checks whether its
  table already has any row and returns early if so, so restarting the app against
  an existing DB file never re-inserts or duplicates rows. `upload_batches` and
  `upload_students` are never seeded, per the plan.

**Troubleshooting / findings (with evidence):**
- **Corrected seed row counts.** The original plan text said "13 programme rows,
  251 student rows", based on naive `wc -l` line counts. Parsing both CSVs with
  Python's `csv` module gives the true counts: **14 programme rows, 252 student
  rows.** Root cause: neither sample CSV file ends with a trailing newline after
  its last data row (confirmed via `xxd` on the last bytes of each file), and
  `wc -l` counts newline characters, so it silently undercounts the last line by
  one in both files. This is now the expected count everywhere in this plan and in
  `manual_testing_guide.md`.
- **Sample data quirks observed while writing the seed check (not "fixed" at the
  time, loaded faithfully as-is; all three later resolved at the source - see the
  2026-08-22 addendum below):**
  - ~~Two `AEI_programmes.csv` rows... blank `nmc_traininginstitutecode`~~ -
    **resolved**: both rows now carry a real institute code (`1315`).
  - ~~One `AEI_programmes.csv` row has `nmc_trainingtype` stored as
    `'F         '`~~ - **resolved** for that row (now `'F'`). Note: this was
    fixed for the `P2`/training-type-`F` rows specifically; the `DF3`
    (`'S         '`) and one `1`/`8020` (`'G         '`) rows still carry the same
    kind of trailing-space padding as of this writing - Phase 3 matching should
    still treat `nmc_trainingtype` comparisons as whitespace-tolerant rather than
    assume every row has been cleaned up.
  - ~~Every single `master_students.csv` row (252/252) has `nmc_institutecode !=
    nmc_traininginstitutecode`~~ - **resolved by removal**: `nmc_institutecode`
    was dropped from `master_students.csv` and the `MasterStudent`/`UploadStudent`
    models entirely, since it was redundant with `nmc_traininginstitutecode`.
- **FK enforcement gap found and fixed.** First implementation declared the
  `upload_students.upload_batch_id -> upload_batches.nmc_uploadbatchid` FK but a
  manual test proved SQLite silently accepted an insert referencing a
  non-existent batch id (SQLite ignores FK constraints unless a per-connection
  `PRAGMA foreign_keys=ON` is issued - not the default). Fixed with a
  `sqlalchemy.event.listens_for(engine, "connect")` hook in `app/db.py`; re-ran
  the same manual check and confirmed the insert now raises `IntegrityError`.
- **Test-suite self-check.** Deliberately broke the seeding idempotency guard
  (commented out the "already seeded" early-return) and confirmed
  `test_seed_is_idempotent` fails loudly (28 programme rows instead of 14) before
  reverting - same discipline as the Phase 1 lifespan-test check, to make sure a
  passing suite reflects a real guarantee rather than a test that can't fail.

**Verification performed:**
- `backend/tests/test_phase2_database.py` (9 new tests, all against an in-memory
  SQLite engine with the same FK-enforcement setup as the real app): seed row
  counts (14 programmes / 252 master students), idempotent double-seed, a
  programme spot-check (`SC1` resolves to both qualification levels `A` and `F`
  under institute `1315`), a master-student spot-check (`16H0404E`), both upload
  tables start empty, the batch PK autoincrements, an upload_student correctly
  links to its batch, and an upload_student referencing an unknown batch id is
  rejected. Combined with Phase 1's 4 tests: **13/13 pass.**
- Live-server pass: fresh `uv run uvicorn app.main:app --port 8008` against a
  deleted DB file, counts checked independently via the `sqlite3` CLI (not just
  the app's own ORM) - 14/252/0/0. Restarted the same process against the
  existing DB file (no delete) - counts unchanged at 14/252, confirming no
  duplication outside of pytest too.

**Deliverable state:** ready for the manual checks in `manual_testing_guide.md`
Phase 2 section (row-count expectations there corrected to 14/252 to match the
finding above) before starting Phase 3.

**Addendum (2026-08-22): source data corrected, `nmc_institutecode` removed**

Following manual test of Phase 2, the requester edited the source sample data
directly (`requirement_doc/sample_data/`): populated the 2 blank
`nmc_traininginstitutecode` values in `AEI_programmes.csv` (both now `1315`),
trimmed the padded `nmc_trainingtype` `'F         '` -> `'F'` for the `P2` rows,
and removed the `nmc_institutecode` column from `master_students.csv` entirely as
redundant with `nmc_traininginstitutecode`. Schema and seed data updated to match:

- `backend/app/models.py`: removed `nmc_institutecode` from `MasterStudent` and
  `UploadStudent` (the latter mirrors the former's attribute set, so it drops too).
  `UploadBatch.nmc_institutecode` is untouched - that is a different field (the
  institute selected at the start of the upload journey), not the one removed.
  Also tightened `Programme.nmc_traininginstitutecode` from optional back to
  required, now that the source data has no blank values left to accommodate.
- `backend/app/seed_data/*.csv` refreshed from the corrected
  `requirement_doc/sample_data/*.csv` (row count unchanged at 14/252 - values
  fixed, no rows added or removed).
- Added 3 regression-guard tests to `backend/tests/test_phase2_database.py`:
  no programme row has a blank institute code, the `P2` rows' training type is
  exactly `"F"` (not padded) on both rows (they differ by
  `nmc_qualificationlevel`, `F`/`P`, not by training type - an assertion I
  initially got imprecise and corrected after checking the actual CSV values
  again rather than trusting my first assumption), and `MasterStudent` no longer
  exposes `nmc_institutecode`. **15/15 tests pass.**
- Re-verified live: fresh `uv run uvicorn ... --port 8008` against a deleted DB,
  `sqlite3` CLI checks - 14 programmes / 252 master_students, `.schema
  master_students` shows no `nmc_institutecode` column, `SELECT count(*) FROM
  programmes WHERE nmc_traininginstitutecode='' ...` returns 0, and the
  previously-blank `AN1`/qualification-`A` row now resolves to institute `1315`.
- `requirement_doc/requirements.md` and `requirement_doc/UI_requirements.md`
  checked (grepped for `nmc_institutecode`, `nmc_trainingtype`, `blank`) - neither
  references the removed column or the specific data-quality issues, so **no
  changes needed** in either.
- `requirement_doc/database_requirements.md` still lists `nmc_institutecode` under
  `master_students` (line ~56) - **not updated**, since it wasn't in the
  requester's list of docs to update for this change; flagged back to them rather
  than edited unilaterally.

**Addendum 2 (2026-08-22): remaining `nmc_trainingtype` padding removed**

The earlier addendum's fix only covered the `P2` rows; the `DF3` rows
(`'S         '`) and one institute-`8020` `1` row (`'G         '`) still had
trailing-whitespace padding, as flagged at the time. The requester has now fixed
all of these in `requirement_doc/sample_data/AEI_programmes.csv` too - every
`nmc_trainingtype` value across all 14 rows is now unpadded (verified with
Python's `csv` module: 0 rows differ from their own `.strip()`'d value, in both
`AEI_programmes.csv` and `master_students.csv`).

- `backend/app/seed_data/AEI_programmes.csv` refreshed from the corrected source.
- The requester also asked to fix the **already-running dev SQLite database**
  directly (not just reseed), since the app's seeding is idempotent and won't
  touch a table that already has rows. Ran `UPDATE programmes SET
  nmc_trainingtype = TRIM(nmc_trainingtype);` against
  `backend/data/aei_upload.db` directly via the `sqlite3` CLI. Verified
  before/after with `SELECT nmc_programme, nmc_qualificationlevel, '[' ||
  nmc_trainingtype || ']' ...` - `DF3` and the `8020`/`1` row changed from
  `[S         ]`/`[G         ]` to `[S]`/`[G]`; row count unchanged at 14.
- `test_p2_programme_training_type_is_not_padded` widened into
  `test_no_programme_training_type_has_trailing_whitespace` in
  `test_phase2_database.py`, asserting every seeded programme row's
  `nmc_trainingtype` equals its own `.strip()`, not just the `P2` rows. **15/15
  tests still pass** (test count unchanged - one test replaced, not added).
- Re-verified with a fully fresh DB (deleted, restarted, reseeded from the
  corrected CSV): `SELECT DISTINCT nmc_trainingtype` now returns exactly `F`,
  `G`, `M`, `R`, `S` - no padded duplicates.
- No further doc changes needed in `requirements.md` / `UI_requirements.md` (same
  grep-based check as the first addendum still holds - neither references
  training-type padding).

### Phase 3 - Backend Logic Development
- **Lookups**: endpoints returning distinct institute (code + name), and programmes
  filtered by institute code, for the drop-downs on First Page, Upload Programme
  Selection, Upload-OriginalPath, and the Revised Programme drop-downs.
- **File parsing**: accept `.xlsx`/`.csv` upload, read rows into a common in-memory
  structure matching `master_students` columns.
- **Matching/validation logic** (`services/matching.py`): for each uploaded row,
  compare against `master_students` on the relevant attributes; if a full match is
  found, set `nmc_rowstatus = 'Success'`; otherwise set `'Failed'` and populate
  `nmc_error1description` .. `nmc_error5description` in the order fields are checked,
  using the "<Field> does not match with organization's record." message pattern
  from `requirements.md`.
- **Batch creation**: on upload, create one `upload_batches` row (running
  `nmc_uploadbatchid`, totals, institute/programme/academic route context - populated
  only for the alternate path per the schema note) and one `upload_students` row per
  file line.
- **Alternate path** endpoint: institute + single programme selected up front, so
  every row is validated against that fixed programme.
- **Original path** endpoint: institute code mandatory, programme/academic route
  optional filters only (not forced onto every row).
- **Resubmission logic**: three flows from `UI_requirements.md` Enhancement 1/2 -
  (a) single row with a revised programme, (b) bulk-selected rows with one revised
  programme, (c) full-record edit via View Details - all re-run the matching logic
  and update the existing `upload_students` row plus batch totals.
- **Delete** endpoint for a single error row (no undo, per spec).
- Unit tests (pytest) for the matching logic covering: full match, single-field
  mismatch (each of the five error slots), and multi-field mismatch.

**Status: Complete (2026-08-22)**

The plan bullets above only give two worked examples ("programme" then "first
name" as the first two errors) and leave the rest of the design - which fields
are checked, in what order, how many, what happens when the PIN itself doesn't
match anything, how the two upload paths differ mechanically, what the API
surface looks like - unspecified. Every non-obvious decision made to fill those
gaps is recorded below, each grounded in the requirement docs rather than
guessed.

**API surface added** (all under `/api`, JSON except the two upload endpoints
which are `multipart/form-data`):
- `GET /institutes`, `GET /programmes?institute_code=...` (`app/routers/lookups.py`)
- `POST /uploads/alternate-path` (form: `institute_code`, `nmc_trainingtype`,
  `nmc_programme`, `nmc_academicroute`, `file`), `POST /uploads/original-path`
  (form: `institute_code` mandatory, the three programme fields optional, `file`)
- `GET /batches`, `GET /batches/{id}` (`app/routers/uploads.py`)
- `POST /upload-students/resubmit-with-programme` (body: `upload_student_ids: list[int]`
  + the three programme fields) - **one endpoint for both single-row and bulk
  resubmission** (flows a/b from the plan): a single-row call is just a
  1-element id list. Kept as one endpoint rather than two near-duplicates since
  the logic is identical either way.
- `POST /upload-students/{id}/resubmit-full` (body: the complete editable
  record) - flow (c), View Details.
- `DELETE /upload-students/{id}` - 204, no undo.

**Matching logic design** (`app/services/matching.py`):
- **Field check order and list**: a combined **Programme** check first (all of
  `nmc_traininginstitutecode`/`nmc_trainingtype`/`nmc_programme`/
  `nmc_academicroute` together - a mismatch on any one of them produces the
  single "Programme does not match..." message, not up to 4 separate ones),
  matching the plan's own first example. After that, every field shown on the
  View Details page (`UI_requirements.md`), in the same order as its tabs:
  Title, First name, Maiden name, Last name, Date of birth, Gender,
  Nationality, then the 3 address lines, City, Postcode, Country, then the 3
  course dates. Fields master_students has but View Details never shows
  (`nmc_email`, `nmc_countryofbirthname`) are **not** checked - a user can't
  correct what they can't see/edit on that page, so flagging them would be a
  dead end.
- **Error slots are filled sequentially, not per-field-fixed.** "that's the
  first error... write into nmc_error1description... that's the second
  error... nmc_error2description" (`requirements.md`) reads as "the Nth
  mismatch found goes in slot N", not "field X always lives in slot Y". A row
  with only a Last name mismatch gets that message in `nmc_error1description`,
  not a fixed slot 5. Capped at 5 total (`MAX_ERRORS`); if more than 5 fields
  actually mismatch, the row is still `Failed` but only the first 5 (in check
  order above) get a message - the schema only has 5 slots.
- **PIN not found**: not addressed in the requirement docs at all (they only
  describe field-by-field mismatches on an already-located master record).
  Designed as its own outcome: `Failed` with a single message, "NMC PIN does
  not match with organization's record.", using the same message pattern
  applied to the PIN field itself, and skipping the other 15 field checks
  (nothing to compare them against).
- **Blank equivalence**: `None` (an `Optional` column with nothing seeded) and
  `""` (an empty string parsed from a CSV cell) are treated as the same
  "blank" value when comparing - otherwise every upload row with a blank
  maiden name would falsely mismatch against a master record whose maiden name
  is stored as `None`. No other normalization (case, whitespace) is applied -
  upload-file values are already `.strip()`'d at parse time (see below), and
  master_students is expected clean per the Phase 2 addenda.
- Comparison is exact/case-sensitive otherwise - this is meant to be a strict
  verification tool, not fuzzy matching.

**Alternate path vs Original path row construction** - this is the one place
the two paths actually differ mechanically, and it's what makes "Same course
for all Students" a genuine shortcut rather than just a UI convenience:
- **Alternate path**: the row's `nmc_traininginstitutecode`/`nmc_trainingtype`/
  `nmc_programme`/`nmc_academicroute` are always **overwritten** with the
  selected programme's values before matching, regardless of what (if
  anything) the uploaded file has in those columns. This is what
  "students... are linked to the selected programme" (`requirements.md`
  Purposes, item A) means in practice - the file doesn't need programme
  columns at all for this path.
- **Original path**: every row's own programme fields come from the file,
  untouched. The selected institute code (mandatory) and optional
  programme/academic route are stored on the batch for context, exactly as
  `database_requirements.md` describes them, and used for nothing else -
  matching the plan's own phrasing, "optional filters only (not forced onto
  every row)", extended to institute code too since original path is
  explicitly "Multiple course - Multiple students".

**"Programme" selection is a 4-tuple, not a specific `programmes` row** - the
Revised Programme / Upload Programme Selection dropdown label
(`nmc_trainingtype`-`nmc_programme`-`nmc_academicroute`-`nmc_programmename`,
per `UI_requirements.md`) doesn't include qualification level, so two
`programmes` rows that only differ by qualification level (e.g. `SC1` `A` vs
`SC1` `F`) present as **one** selectable choice. `app/services/programmes.py`
(`list_programme_choices`) deduplicates on exactly those 3 columns. This also
retroactively confirms the Phase 2 decision not to give `master_students`/
`upload_students` a hard FK to a specific `programmes.id` row - the UI's own
concept of "a programme" is inherently ambiguous with respect to qualification
level, so a plain-business-columns design was the right call, not a shortcut.

**New file beyond the plan's Phase 1 layout**: `app/services/programmes.py` -
institute/programme lookup and dedup logic, plus a `resolve_programme_name`
join helper. Kept separate from `services/matching.py` (different concern -
resolving *which* programme, not validating a row against one) and from the
routers (reused by both `routers/lookups.py` and `routers/uploads.py`, so it
doesn't belong to either alone).

**What's server-computed vs left to Phase 4**: resolving *data* that requires
a join server-side already has - e.g. an upload_student's `nmc_programmename`
(joined from `programmes` by its own institute/type/programme/route columns,
since `upload_students` doesn't store a programme name itself), or a batch's
`institute_name` (joined from `programmes` by `nmc_institutecode`, since
`upload_batches` only stores the code) - stayed in scope for Phase 3. Pure
*display string formatting* (concatenating "Name - Code", or
"trainingtype-programme-route-programmename" with hyphens) was deliberately
left to Phase 4: it needs no data the frontend won't already have from the raw
fields, and the plan's own Phase 3 bullets describe "distinct institute (code
+ name)" and "programmes filtered by institute code" - raw data for drop-downs,
not pre-formatted labels.

**Batch status label**: `database_requirements.md`/`UI_requirements.md` only
define the `Failed` case ("Status (value is 'Failed' if there's >= 1 record
with error)"). The non-failed value is never named in the text spec: used
`"Processing Complete"`, the literal text shown in that state in
`UploadSummary.png`.

**Line numbers start at 2**: "Line number (row number in the Excel file; no
column header)" is ambiguous between "1st data row = 1" and "1st data row = 2
because the header occupies row 1". Went with the latter (`enumerate(rows,
start=2)` in the upload routers) since that's how row numbers actually look
when an AEI user reopens their own spreadsheet to fix a flagged row - row 1 is
always the header there.

**File parsing** (`app/services/parsing.py`): `UPLOAD_COLUMNS` assumes the
uploaded file's header matches `master_students`' business column names
exactly (no such template is provided in `requirement_doc/`, so this is an
inferred convention, consistent with how the sample `master_students.csv` -
itself representing "a student record" - is shaped). A column missing from
the file just yields `None` for that row, which then surfaces naturally as a
mismatch (or "PIN not found") during matching - no separate upload-time
validation step needed. Cell values are `.strip()`'d and blank cells become
`None`; `.xlsx` date-formatted cells (which openpyxl returns as `datetime`/
`date` objects) are converted to the same `YYYYMMDD` string form the CSVs use,
so both file types feed matching identically. This trimming is a deliberate,
narrow exception to "don't program defensively" - CLAUDE.md's own carve-out is
"validate at system boundaries", and an uploaded file is exactly that; nothing
else is auto-corrected.

**Noted for Phase 4, not acted on now**: `UI_requirements.md`'s View Details
tab 1 maps "Nationality" to `nmc_country` - no such column exists on
`master_students`/`upload_students` (it's `nmc_nationalityname`). Treated as a
doc typo; Phase 4 should bind the Nationality field to `nmc_nationalityname`.

**Troubleshooting (with evidence):**
- **StaticPool bug in the new test fixture.** The first version of
  `tests/conftest.py`'s `client` fixture created and seeded an in-memory
  `sqlite://` engine, then overrode `get_session` to open new `Session(engine)`
  connections per request. All 20 of the new API tests failed with `no such
  table: upload_batches`. Root cause: a bare `sqlite://` in-memory database only
  exists for the lifetime of one connection - each new `Session` opened a
  *different*, empty, table-less database, invisible to the one that had
  created and seeded the schema. Fixed by adding `poolclass=StaticPool` (the
  documented SQLAlchemy fix for sharing one in-memory SQLite database across
  multiple connections/sessions). All tests passed immediately after.
- **Resubmit-with-programme partial-failure behaviour verified, not assumed.**
  When a bulk resubmit request's id list contains one valid id followed by an
  invalid one, does the valid row's fix get silently persisted before the
  request 404s? Reasoned that no - `get_session`'s `with Session(engine) as
  session: yield session` closes (and thus rolls back any uncommitted
  transaction on) the session when the request handler exits via exception,
  and `resubmit_with_programme` never calls `session.commit()` until the whole
  loop succeeds - then wrote
  `test_resubmit_with_programme_unknown_id_is_404_and_does_not_partially_apply`
  to check it directly rather than trust the reasoning alone. Passed on the
  first run.
- **Manually walked every command in the `manual_testing_guide.md` Phase 3
  section against a live server before finalizing it**, exactly as written,
  and found one real doc bug this way: the original `resubmit-full` example
  omitted several fields (address lines, course dates, nationality, etc.).
  Since that endpoint treats the request body as the complete corrected
  record (any omitted field is set to blank), the omitted fields - which are
  genuinely populated on the master record - became fresh mismatches, and the
  row came back `Failed` instead of the guide's claimed `Success`. Fixed by
  sending the complete field set (confirmed `Success` afterward) and rewrote
  the guide to explain why, using the failure itself as the illustration
  rather than hiding it.

**Verification performed:**
- `uv run pytest -v`: **52/52 pass** - 15 carried over from Phases 1-2, plus
  `tests/test_phase3_matching.py` (10: full match; PIN not found; Programme
  mismatch alone, including an institute-only difference still counting as one
  Programme error; First/Last name/DOB/Gender mismatches alone; None-vs-empty
  blank equivalence; 5-mismatch cap in check order), `tests/test_phase3_parsing.py`
  (6: CSV/XLSX basic parsing, blank-row skipping, whitespace trimming, XLSX
  date-object conversion, unsupported extension), and
  `tests/test_phase3_uploads_api.py` (21, via a new `tests/conftest.py`
  isolated-DB `client` fixture: lookups incl. qualification-level dedup,
  both upload paths incl. the alternate-path override / original-path
  no-override behaviours, unsupported file type -> 400, empty file -> 0
  records, batch listing/detail incl. 404, all three resubmission flows, the
  partial-failure check above, delete incl. no-undo).
- Manual, ad hoc verification beyond the automated suite: a real `.xlsx` file
  uploaded through the actual router (not just the parser in isolation) with a
  `datetime.date` cell, confirmed correctly converted and matched.
- Live-server pass: fresh `uv run uvicorn app.main:app --port 8008`, confirmed
  `/api/institutes`, `/api/health`, and `/` (still serving the frontend) all
  respond correctly through the real process/port.
- Every command in `manual_testing_guide.md`'s Phase 3 section run against a
  live server end-to-end, output compared line-by-line against what the guide
  claims (see the `resubmit-full` bug above - the guide is now accurate to
  what actually happens, not just what was intended).

**Deliverable state:** ready for the manual checks in `manual_testing_guide.md`
Phase 3 section before starting Phase 4.

**Addendum (2026-08-22): upload file column mapping clarified**

After Phase 4 (during Phase 5 work), the requester added an "upload file
field mapping" section to `requirements.md`, giving the upload file's actual
column headers (e.g. `NMC PIN`, `Middle Name`, `Course Code`, `Academic
Level`, `Pass Date`) and their mapping to `upload_students` columns. This
revealed that Phase 3's original assumption - "`UPLOAD_COLUMNS` assumes the
uploaded file's header matches `master_students`' business column names
exactly" - was wrong: the real file headers are human-readable labels, not
the internal `nmc_*` names.

- `backend/app/services/parsing.py`: `UPLOAD_COLUMNS` (a flat list) replaced
  with `FILE_COLUMN_TO_FIELD` (a dict mapping each real file header to its
  `nmc_*` field). `_parse_csv`/`_parse_xlsx` now build each row by looking up
  cells by the file's own header name. `Previous Institute Code` maps to "no
  table field" per the mapping doc and is intentionally dropped at parse
  time (never written into the row dict at all, not even as `None`).
- `backend/tests/test_phase3_parsing.py` and
  `backend/tests/test_phase3_uploads_api.py` (`CSV_HEADER`) updated to use
  the real file headers instead of `nmc_*` names; added
  `test_parse_csv_ignores_previous_institute_code_column`. **58/58** tests
  pass (was 52 before this addendum; net +6: +1 parsing test, +5 new Phase 5
  lookup/upload-student tests - see the Phase 5 entry below).
- **Verified the mapping is load-bearing, not just documentation**: renamed
  the `"NMC PIN"` key to `"WRONG HEADER"` and confirmed 11 real test
  failures (every test whose CSV fixture depends on the PIN, name, or
  programme columns parsing correctly), then reverted and confirmed 58/58
  passes again.
- `myplan/manual_testing_guide.md`'s Phase 3 curl examples updated to the
  real file headers (both `alt_ok.csv` and `orig.csv` inline heredocs).

### Phase 4 - UI Development
Build each page from `UI_requirements.md` and its named diagram, keeping consistent
spacing/layout across pages and stripping NMC-specific chrome per the Generate Notes
(no logo/NMC text -> 'Prototype', no header/footer links, Advanced Search greyed out,
Search disabled).

- **First Page**: institute drop-down (`Institute Name - Institute Code`, distinct
  values).
- **Upload Summary**: Change button, Upload File button, Upload Summary message box,
  disabled Advanced Search/Search, batches subgrid with the specified columns and a
  View Details drop-down.
- **Upload Path Selection**: static guidance text (verbatim per spec) plus the two
  path buttons.
- **Upload Programme Selection** (alternate path): single programme drop-down scoped
  to the selected institute, file picker, Upload button.
- **Upload-OriginalPath**: mandatory institute code, optional programme/academic
  route drop-downs, file picker, Upload button.
- **Upload Result**: batch attributes header, Uploaded Records subgrid, Error Records
  subgrid, both with 4-row infinite scroll.
- **Error Records subgrid enhancements**: select-all checkbox, top-level Revised
  Programme + Submit for bulk resubmission; per-row columns (line number, name,
  NMC PIN, created on, message/error type, status reason, programme, training type,
  course code, academic route, revised-programme drop-down, Resubmit, and a
  View Details/Delete dropdown).
- **View Details**: 4 tabs (Student Details, Student Address, Programme Information,
  Previous Institute) with the exact field mappings and transforms listed (e.g. date
  of birth to `YYYY-MM-DD`), inline red error text under the offending field, equal
  tab heights, Back and Resubmit actions.
- Colour palette approximated from the NMC education pages reference, applied
  consistently, without using NMC logo/copy.

**Status: Complete (2026-08-22)**

Phase 4 is explicitly UI-structure-only per this plan (Phase 5 is where pages
get wired to the real API), so every page runs on hardcoded mock data in
`frontend/app/lib/mockData.ts` - shaped **exactly** like the real Phase 3 API
response types (mirrored in `frontend/app/lib/types.ts`), so Phase 5 should be
a like-for-like swap of mock arrays for `fetch()` calls, not a rewrite.

**Pages built** (all under `frontend/app/`, each a route folder with a single
`page.tsx`): `/` (First Page), `upload-summary/`, `upload-path-selection/`,
`upload-programme-selection/`, `upload-original-path/`, `upload-result/`,
`view-details/`. Shared pieces: `components/PageShell.tsx` (header),
`components/buttonStyles.ts`, `components/GuidanceBox.tsx`,
`components/ErrorRecordsSubgrid.tsx`, `components/ViewDetailsField.tsx`,
`lib/format.ts` (all display formatting/transform logic), `lib/types.ts`,
`lib/mockData.ts`.

**Navigation state**: every cross-page value (institute code/name, batch id,
student id) travels as a **URL query parameter**, not React Context or
`localStorage`. No auth/session exists per the requirements, so this keeps
every page's data dependency explicit and bookmarkable, and needed no new
state-management dependency. Every page reading `useSearchParams()` is wrapped
in `<Suspense>` (required for Next's static export - a page calling
`useSearchParams()` without one fails to prerender).

**Header/footer**: replaced entirely with one purple bar reading "Prototype" -
no logo image, no Contact Us/Help/Home/Account Services/Log Out links, no
footer at all. `requirements.md`'s General Notes say both "Do not show 'NMC'.
Replace NMC logo and shortform by 'Prototype'" and "links in the page header
and footer are not needed" - taken together and applied literally, there was
nothing left of the diagrams' header/footer chrome to keep except the branding
band itself.

**Design decisions beyond the diagrams/spec** (each with its reasoning, so
Phase 5/6 knows what's deliberate vs. what to revisit):
- **Upload Path Selection reconciled with Back/Next.** `UI_requirements.md`'s
  prose says the two square buttons "lead to" their respective paths directly,
  but the diagram also shows Back/Next below them. Implemented as: clicking a
  square *selects* it (highlighted state), Next (disabled until a selection
  exists) navigates, Back returns to Upload Summary - matches the diagram
  exactly and is a strict superset of the prose description.
- **"Next" became "Upload" on the two upload-start pages.** The base diagrams
  for Upload Programme Selection and Upload-OriginalPath predate the
  "Additional elements" instructions that add a file picker + Upload button to
  each. Once that button exists, a separate "Next" doing nothing but advancing
  the same step is redundant, so Upload replaces it (still gated - disabled
  until the required selections and a file are present).
- **Upload-OriginalPath's Institute Code pre-fills from First Page's
  selection but stays changeable.** The spec mandates a fresh Institute Code
  selection on this page without saying whether it should inherit the
  session's institute - defaulting to it is the lower-friction, almost-always-
  correct choice while still allowing the literal "select the institute code"
  requirement.
- **Batch status "Processing Complete".** `database_requirements.md` /
  `UI_requirements.md` only define the `Failed` case in words; used the exact
  text `UploadSummary.png` shows for an all-success batch, same choice already
  made and tested in Phase 3's `_batch_summary()`.
- **Gender shown/edited as "Male"/"Female" in View Details, not the stored
  `M`/`F`.** Read directly off `ViewDetails.png` ("Gender: Male"), even though
  every other layer of this system (DB, API, matching messages) uses the
  single-letter code - a display-only mapping local to that one page
  (`GENDER_LABELS`/`GENDER_CODES` in `view-details/page.tsx`), converted back
  to the code before the (future, Phase 5) resubmit call.
- **"Nationality" bound to `nmc_nationalityname`, not `nmc_country`.**
  `UI_requirements.md`'s View Details tab 1 literally says "Natoinality -
  nmc_country", but no such column exists anywhere in the schema (it's
  `nmc_nationalityname`) - flagged as a probable doc typo back in the Phase 3
  log, resolved here as anticipated.
- **Two UI simplifications from the diagrams, both same-options-different-
  presentation:** the Error Records subgrid's "View Details / Delete"
  drop-down button (`ErrorRecordsSubgrid.png`) is two always-visible inline
  actions instead of a hidden dropdown menu; the single-entry "View Details"
  drop-down on the Upload Summary batches table (`UploadSummary.png`) is a
  plain link. Both dropdowns only ever had one meaningful destination each, so
  the simplification changes presentation, not functionality.
- **"NMC PIN" / "NMC Programme" field labels kept as literal text**, even
  though the General Notes say "Do not show 'NMC'". Read that note as
  targeting the organisation's brand identity (the instruction's own wording
  is "NMC logo and **shortform**" - i.e. don't refer to the organisation by
  name/logo), not the exact field-mapping text `UI_requirements.md` spells out
  field-by-field elsewhere ("NMC PIN - nmc_nmcpin", "NMC Programme -
  nmc_programme", and "NMC PIN" as an Error Records column header). Genuinely
  ambiguous - flagged in `manual_testing_guide.md` for the requester to
  overrule if the intent was broader text scrubbing.
- **Both subgrids' "infinite scroll, ~4 rows visible"** implemented as a
  `max-h-56 overflow-y-auto` scrollable region around an already-fully-loaded
  table, not paginated fetch-on-scroll - every row is already in memory (mock
  now, a single API response later), so a plain scroll container satisfies
  "no need to click a button to see the next 4 rows" without inventing
  pagination machinery this prototype doesn't need.
- **Uploaded Records subgrid's columns** (Line Number, Name, NMC PIN, Created
  On, Programme) were designed from scratch - `UI_requirements.md` never gives
  this subgrid its own column list (only Error Records gets one, under
  Enhancement 2); the diagram's shared header row includes Error
  Records-specific columns (Message Type, Error Type) that don't apply to a
  successful row, so they were dropped here rather than shown meaningless for
  every success row.

**Tooling added**: Vitest + React Testing Library + jsdom
(`vitest.config.mts`, `vitest.setup.ts`, `npm test`). Chosen over relying on
manual/browser checks alone so the pure formatting logic (`lib/format.ts`) and
the most complex interactive component (`ErrorRecordsSubgrid`) have a fast,
repeatable regression check, matching the "detailed unit test" bar set in
Phases 1-3.

**Troubleshooting (with evidence):**
- **Missing DOM cleanup between tests.** The first version of
  `ErrorRecordsSubgrid.test.tsx` had 2 of 6 tests fail with "found multiple
  elements" errors that made no sense from the component's source (only one
  "Submit" button exists). Root cause: `vitest.setup.ts` only imported
  `@testing-library/jest-dom/vitest` - nothing was calling
  `@testing-library/react`'s `cleanup()` between tests, so every `render()` in
  a later test added to, rather than replaced, the previous test's DOM output,
  and duplicate elements accumulated across the file. Fixed by adding an
  `afterEach(() => cleanup())` in the setup file; all tests passed immediately
  after, and the fix is structural (applies to every future test file), not a
  one-off workaround for this one file.
- **Config warning cleanup.** `vitest.config.ts` triggered a Vite warning
  about ESM-in-a-CommonJS-loaded-file; renamed to `vitest.config.mts` (no
  other change) to resolve it cleanly rather than suppress the warning or add
  `"type": "module"` to `package.json` (which would affect the whole project,
  not just this one config file).
- **ESLint unused-var warnings fixed at the source, not suppressed.** Two
  warnings (`_ids` in `ErrorRecordsSubgrid`'s `resubmit`, two destructured-
  and-discarded fields in `mockData.ts`) were fixed by actually removing the
  unused parameter and by replacing a destructure-and-spread with a named
  `toBatchSummary()` helper, rather than reaching for
  `eslint-disable`/underscore-ignore config changes.

**Verification performed:**
- `npm run lint` - clean. `npm run build` - clean, all 7 routes prerendered as
  static content. `npm test` - **20/20 pass** (14 `lib/format.ts` tests
  covering every formatting/transform function including a BST-vs-GMT
  `Intl.DateTimeFormat` check across the DST boundary; 5 `ErrorRecordsSubgrid`
  tests covering row rendering, the empty state, select-all toggling both
  directions, delete-removes-the-row, and the bulk Submit disabled-state gate;
  1 First Page test covering the disabled-until-selected Continue button and
  the exact query string it navigates with).
- Backend's full suite re-run to confirm no regression from this phase (none
  expected - no backend files touched): **52/52 still pass.**
- Full live browser walkthrough (Playwright MCP) against the real single-port
  server (`uv run uvicorn app.main:app --port 8008`, frontend
  production-built first): First Page -> select institute -> Upload Summary ->
  Upload Path Selection (verified Next stays disabled until a square is
  picked) -> Upload Programme Selection (verified the programme drop-down
  has exactly 4 choices for institute `1315`, uploaded a real file through the
  actual file-picker UI, Upload enabled only once both selections exist) ->
  Upload Result for the resulting batch -> navigated directly to the
  mixed-result batch to exercise a populated Error Records subgrid -> View
  Details on the failed row (confirmed the red inline error message renders
  under First Name specifically, DOB shows as `2002-05-24`, Gender shows as
  "Female") -> cycled all 4 tabs -> Resubmit -> landed back on Upload Summary,
  matching the spec's stated end state. Also independently loaded
  Upload-OriginalPath and confirmed the Institute Code pre-fill/override
  behaviour. Screenshots taken and inspected at several of these steps to
  confirm the colour palette and disabled-state styling read correctly, not
  just the accessibility tree.

**Deliverable state:** ready for the manual checks in `manual_testing_guide.md`
Phase 4 section before starting Phase 5. Two judgment calls are flagged there
for the requester to confirm or overrule: the "NMC PIN"/"NMC Programme" field
labels, and the two dropdown-to-inline-actions simplifications.

**Addendum (2026-08-22): post-manual-test amendments**

Manual test passed; the requester asked for 7 follow-up amendments (a-g).
All implemented, verified live (Playwright), and the full suite re-run clean.

- **(a) Upload Summary Search -> magnifying glass icon.** The disabled search
  `<input>` no longer carries "Search" as visible placeholder text; a second,
  equally-disabled icon-only button (`components/icons.tsx`'s `SearchIcon`,
  `aria-label="Search"`) sits next to it. Both stay non-interactive - this is
  additive styling, not a new control.
- **(b) Upload Path Selection - right-aligned square text.** The two square
  buttons were `flex-col items-center justify-center text-center`; since
  `flex-col`'s cross-axis is horizontal, the fix was `items-end` (not
  `justify-end`, which would have pushed content to the bottom instead - caught
  before shipping by remembering flex-col swaps which axis is which) plus
  `text-right` so wrapped text stays right-aligned on every line. `h-32 w-40`
  (the squares' size) untouched, per "keep the size".
- **(c) Upload Programme Selection.** Two changes:
  - "Choose file" is now an icon button (new shared
    `components/FilePickerIcon.tsx`: a visually-hidden real `<input
    type="file">` plus a styled icon button that calls `.click()` on it -
    the standard pattern for a custom-styled native file input), disabled
    until a programme is selected, and clearing any previously-chosen file
    when the programme selection changes (avoids a stale file surviving a
    now-invalid selection).
  - **HEI Programme now lists distinct `nmc_aeiprogrammetitle` values**, not
    the training-type/programme/route/programme-name label used elsewhere.
    This is a real behavioural change, not just a label swap: `programmes`
    rows that share training type + programme + academic route but differ by
    qualification level (e.g. `SC1`'s Apprenticeship vs Full Time variants)
    have **different** `nmc_aeiprogrammetitle` values, so this drop-down now
    shows **8** entries for institute `1315`, not the 4 the Revised Programme
    drop-down shows - deliberately, since picking the exact qualification
    variant here is more useful for matching an upload file than the coarser
    3-tuple choice. New mock data (`MOCK_PROGRAMME_TITLES` in
    `lib/mockData.ts`, one entry per real seed-data programme row) and type
    (`ProgrammeTitleChoice`) added for this - **flagging a Phase 5 backend
    gap**: the current `GET /api/programmes` (Phase 3) collapses qualification
    level away by design (see that phase's log entry), so it cannot serve this
    page as-is; Phase 5 will need either a variant of that endpoint or an
    additional one that returns ungrouped rows with `nmc_aeiprogrammetitle`
    and `nmc_qualificationlevel`.
  - The de-dup-by-key logic was factored out into a small tested
    `distinctBy()` helper in `lib/format.ts` rather than left as inline
    `Set` bookkeeping in the page component, once it became clear the same
    shape of logic was worth reusing/testing directly.
- **(d) Upload-OriginalPath - same file-picker-icon treatment**, gated on
  **Programme** specifically (not Institute Code, which was already
  mandatory) - a deliberate UX nudge to make sure the course-code check the
  guidance text describes actually happens before a file can be chosen, even
  though Programme remains a non-applied filter for the actual upload
  processing (per Phase 3's original path design). Upload's own disabled
  condition was widened to `!instituteCode || !programme || !file` to match,
  and choosing a different institute or programme now clears any previously
  picked file.
- **(e) Upload Summary / Error Records.**
  `UI_requirements.md`'s Enhancement 2 column list already had the
  "checkbox in the leftmost of each row" bullet added (the requester's own
  edit, present before this amendment request landed - left as-is, nothing
  to change there). The top controls were restacked from one wrapped row into
  two: "select all" alone on its own line, "Revised Programme" + the
  drop-down + Submit on the line underneath.
- **(f) View Details - darker inactive tab text.** Was reusing
  `--brand-disabled-text` (`#9ca3af`, quite light); added a dedicated
  `--brand-tab-inactive` (`#4b5563`) token in `globals.css` instead of reusing
  the disabled-state colour for an active, clickable tab - those are different
  states and shouldn't share a token just because both used to look similar.
- **(g) Footer on every page.** New `components/PageFooter.tsx`, added once
  inside `PageShell.tsx` so all 7 pages get it automatically. Static
  approximation of `requirement_doc/diagrams/PageFooter.png` (which the
  requester had placed at the repo root - moved to `requirement_doc/diagrams/`
  to sit alongside every other diagram): tagline, "Our values" plus 3 link-
  style columns, a "Follow us" row of 4 decorative icons, and a legal line -
  all plain text/`<span>`/`<li>`, no `<a>` anywhere, confirmed in the
  Playwright accessibility snapshot (no `link` roles inside the footer).
  Exact substitutions applied: "The Nursing and Midwifery Council 2026" ->
  "The UK Health Council", "The NMC" -> "The UKN", "867,000" -> "867" (and the
  diagram's "- Learn more" phrase dropped along with it, since a "Learn more"
  reads as an implied link and the instruction was explicit: no links). The 4
  "social" icons are deliberately abstract/generic shapes
  (`components/icons.tsx`'s `DecorativeIcon`), not reproductions of any real
  platform's logo.
- Left untouched, on purpose: the in-progress, uncommitted "upload file field
  mapping" section the requester had already started drafting in
  `requirements.md`/`UI_requirements.md` before this message (empty right-hand
  sides in the mapping table) - unrelated to amendments (a)-(g) and clearly
  the requester's own unfinished work, not something to complete or revert.

**Verification for this addendum:** `npm run lint`/`npm run build` clean;
`npm test` - **24/24 pass** (20 from the phase's initial build + 4 new:
`distinctBy` behaviour, and `FilePickerIcon`'s disabled/enabled states).
Backend's 52 tests re-confirmed unaffected (no backend files touched). Full
Playwright walkthrough of every changed page after rebuilding: confirmed the
search icon renders next to the (still non-functional) search box; the two
square buttons keep their `h-32 w-40` footprint with text now right-aligned;
Upload Programme Selection's HEI Programme drop-down lists exactly the 8
expected `nmc_aeiprogrammetitle` values for institute `1315` and its file
icon flips from disabled to enabled the moment a programme is picked (checked
both states); the same disabled-to-enabled flip verified on Upload-
OriginalPath gated on Programme; View Details' 3 inactive tab labels read
visibly darker against white; the Error Records "select all" line and the
Revised Programme line underneath it render as two separate lines; and the
footer appears on every page with the exact requested text substitutions
present and no clickable elements inside it.

**Addendum 2 (2026-08-22): two more alignment tweaks**

- **Upload Summary logged-in block**: changed from one line ("Logged in as
  User1, University of Chester" + Change button side-by-side) to two
  right-aligned lines stacked - "You are logged in as User1," on its own
  line, then the institute name + Change button together on the line
  underneath, both right-aligned (`flex flex-col items-end text-right`).
  Matches `UploadSummary.png`'s actual two-line layout more closely than the
  original single-line version did.
- **Upload Path Selection squares**: text alignment flipped from right (the
  previous amendment) to left - `items-end`/`text-right` -> `items-start`/
  `text-left`. Size (`h-32 w-40`) unchanged, per instruction, both times.
- Verified live (Playwright, rebuilt frontend + backend on port 8008):
  screenshots confirm both. `npm run lint`, `npm run build`, `npm test`
  (24/24, unaffected - no logic changed, only Tailwind alignment classes) all
  still clean.

### Phase 5 - Integration
- Wire each page to its backend endpoint(s) using the typed API client.
- Implement the full navigation flow exactly as specified: First Page -> Upload
  Summary -> Upload Path Selection -> (Programme Selection | Original Path) -> Upload
  Result -> (Error Records actions -> Upload Summary, or View Details -> Resubmit ->
  Upload Summary).
- Confirm the three error-correction flows (single-row, bulk, View Details) all end
  by returning the user to Upload Summary with a new batch entry visible.

**Status: Complete (2026-08-22)**

**Backend gap closed first** (flagged in the Phase 4 addendum, `ProgrammeTitleChoice`
comment in `frontend/app/lib/types.ts`): Upload Programme Selection's HEI Programme
drop-down needs one entry per distinct `nmc_aeiprogrammetitle`, which varies by
qualification level - unlike `GET /api/programmes`, which deliberately collapses
qualification level away for the Revised Programme use case. Two new endpoints added:
- `GET /api/programme-titles?institute_code=...` (`app/schemas.py`
  `ProgrammeTitleChoiceOut`; `app/services/programmes.py`
  `list_programme_titles` - same shape as `list_programme_choices` but keyed
  by `nmc_aeiprogrammetitle` alone, not the trainingtype/programme/route
  triple, so qualification-level variants stay separate).
- `GET /api/upload-students/{id}` (`app/routers/uploads.py`) - single-row
  fetch for the View Details page, reusing the existing `_to_out` helper so
  the resolved `nmc_programmename` comes along for free. Chosen over
  threading a `batchId` through the View Details URL and refetching the
  whole batch: View Details only ever needs its own row, and this keeps the
  page's data dependency (and its loading/404 states) independent of which
  batch it was reached from.

Both tested in new `backend/tests/test_phase5_integration.py` (5 tests:
8 distinct titles for institute `1315`, institute exclusion, alphabetical
sort, single-row fetch with resolved programme name, 404 for an unknown id).
**58/58** backend tests pass overall (53 carried over + the file-column-mapping
addendum's +1 + these +5, less the 1 test replaced not added in the addendum -
see that addendum above for the exact accounting).

**Frontend wiring** - `frontend/app/lib/api.ts` (new): one typed `fetch`
wrapper per backend endpoint, all against relative `/api/...` paths (no base
URL needed - same single-port origin as the static export, per the
architecture decided in Phase 1). Every page and `ErrorRecordsSubgrid` swapped
its `MOCK_*` import for the matching `api.ts` call:
- **First Page**: `getInstitutes()` on mount (was `MOCK_INSTITUTES`).
- **Upload Summary**: `getBatches()` on mount (was `MOCK_BATCH_SUMMARIES`).
- **Upload Programme Selection**: `getProgrammeTitles(instituteCode)` on
  mount; Upload button now calls `uploadAlternatePath(...)` and routes to
  the **real** returned `nmc_uploadbatchid` (previously hardcoded `1`).
- **Upload-OriginalPath**: `getInstitutes()` and `getProgrammes(instituteCode)`
  replace `MOCK_INSTITUTES`/`MOCK_PROGRAMMES`; Upload button calls
  `uploadOriginalPath(...)` and routes to the real returned batch id
  (previously hardcoded `2`).
- **Upload Result**: `getBatch(batchId)` replaces `MOCK_BATCH_DETAILS`;
  `getProgrammes(batch.nmc_institutecode)` (fetched after the batch resolves,
  so the institute code is known) replaces `MOCK_PROGRAMMES` for the
  Revised Programme drop-downs. Added an explicit `undefined` (loading) vs
  `null` (confirmed 404) state for `batch`, rather than Phase 4's single
  "not found" branch, since a real fetch has a genuine in-flight window a
  synchronous mock lookup never had.
- **ErrorRecordsSubgrid**: bulk and per-row resubmit now call
  `resubmitWithProgramme(...)` (parsing the existing `trainingtype|programme|
  route` option-value key back into the three fields via a new
  `parseProgrammeChoiceKey` helper - the inverse of the existing
  `programmeChoiceKey`) before navigating to Upload Summary; Delete now
  calls `deleteUploadStudent(id)` and only removes the row from local state
  after that resolves, rather than local-only removal.
- **View Details**: `getUploadStudent(studentId)` replaces
  `findMockUploadStudent`; Resubmit now calls `resubmitFull(id, payload)`.
  `payload` is built by a new `toResubmitFullPayload()` helper in `api.ts`
  (explicit field-by-field pick of exactly `ResubmitFullRequest`'s 25
  fields) rather than destructuring-and-discarding the other 11 fields
  inline in the page component - the first draft did the destructure
  inline and tripped 11 `no-unused-vars` warnings; moving the field
  selection into a named, reusable function in `api.ts` (next to the type
  it targets) removed the warnings at the source instead of suppressing
  them, and keeps the "which fields does the server accept" logic in one
  place. `ResubmitFullPayload` itself is `Omit<UploadStudent, ...11 server-
  managed fields>` rather than a hand-written duplicate field list, so it
  can never drift out of sync with `UploadStudent`.
- `frontend/app/lib/mockData.ts` deleted entirely once no page referenced it
  any more (confirmed via a repo-wide grep for `mockData`/`MOCK_` before
  deleting) - Phase 4's stated purpose for the file ("swap mock data for
  real fetch() calls... a like-for-like change") is now complete.

**Troubleshooting (with evidence):**
- **`react-hooks/set-state-in-effect` lint error** in Upload-OriginalPath:
  the first draft's programme-choices effect called `setChoices([])`
  synchronously when `instituteCode` was empty, before an early `return`.
  Fixed by removing that branch from the effect (`if (!instituteCode)
  return;` only) and instead resetting `choices` inside the institute
  `<select>`'s own `onChange` handler, alongside the other already-existing
  resets (`programme`, `academicRoute`, `file`) - a direct user interaction
  resetting state is not the pattern the lint rule flags; an effect
  synchronously setting state on every render is.
- **Verified the new `resubmitWithProgramme` key-parsing logic is real, not
  just green.** `parseProgrammeChoiceKey` splits the option value
  (`trainingtype|programme|route`) back into the three POST fields.
  Temporarily swapped the destructured order (programme and route swapped)
  and confirmed the new `ErrorRecordsSubgrid` bulk-resubmit test fails with
  a clear diff (`nmc_academicroute`/`nmc_programme` values swapped in the
  posted JSON body), then reverted and confirmed 33/33 passes again.
- **Existing tests broken by the switch to real `fetch` calls, fixed by
  mocking `fetch`, not by weakening the assertions**: `page.test.tsx` (First
  Page now loads institutes asynchronously - added `vi.stubGlobal("fetch",
  ...)` and an `await screen.findByRole("option", ...)` before selecting)
  and `ErrorRecordsSubgrid.test.tsx`'s delete test (Delete now awaits a real
  `DELETE` call - added a resolved-`204` fetch stub and asserted the exact
  URL/method called, not just the visual removal).
- Two new test files added for the new logic: `frontend/app/lib/api.test.ts`
  (11 tests: `apiFetch` error/204 handling, FormData body construction for
  both upload endpoints, JSON body shape for `resubmitWithProgramme` and
  `resubmitFull`, `toResubmitFullPayload` field selection) and a new bulk-
  resubmit test in `ErrorRecordsSubgrid.test.tsx`. **33/33** frontend tests
  pass overall (24 carried over + these).

**Verification performed:**
- `cd backend && uv run pytest -v` - 58/58 pass.
- `cd frontend && npm run lint` - clean. `npm run build` - static export
  succeeds, same 7 routes as Phase 4. `npm test` - 33/33 pass.
- **Live end-to-end walkthrough** (built frontend + `uv run uvicorn
  app.main:app --port 8008`, fresh seeded DB, Playwright browser automation)
  covering everything `manual_testing_guide.md`'s Phase 5 section now
  describes: First Page institute drop-down populated from the real API;
  Alternate-path upload of a matching file routes to the real batch id and
  shows a clean Uploaded Records row; Alternate-path upload of a
  first-name-mismatch file shows it in Error Records with the correct
  message; View Details loads the real row (error text under the right
  field, DOB/Gender correctly transformed), editing and resubmitting flips
  it to `Success` in the database (confirmed via `GET /api/batches/{id}`);
  Original-path upload of a two-row file with one genuine programme
  mismatch shows 1 success + 1 "Programme does not match..." error;
  select-all + bulk Revised Programme + Submit flips both rows to `Success`
  and lands on Upload Summary; Upload Summary then lists both real batches,
  newest first, correct totals, "View Details" reopens the right batch;
  Delete calls the real endpoint and is confirmed gone via a follow-up GET,
  including the second-delete 404 (no undo); `/upload-result?batchId=<bad
  id>` renders "Batch not found." instead of crashing. Cleaned up all
  screenshots, the temp `.playwright-mcp/` directory, temp CSV fixtures,
  and the running Uvicorn process afterward, and reset the SQLite file so
  the next manual test starts from a clean seed.
- Deliberately broke two things mid-verification to confirm the tests that
  should catch them actually do (see Troubleshooting above): the file
  column mapping (`FILE_COLUMN_TO_FIELD`'s PIN key) and the
  `parseProgrammeChoiceKey` field order - both reverted after confirming
  real failures.

**Known pre-existing behaviour at first Phase 5 completion, since fixed - see
the addendum immediately below:** all three resubmit flows navigated through
a bare `/upload-summary` with no institute context. Delete does not navigate
away (stays on the same Upload Result page), so it was never affected.

**Deliverable state:** ready for the manual checks in `manual_testing_guide.md`
Phase 5 section before starting Phase 6.

**Addendum (2026-08-22): two post-manual-test defects fixed**

The requester's manual test of Phase 5 found two defects:

**(a) Upload-OriginalPath wrongly required Programme + Academic Route before
allowing a file to be chosen/uploaded.** Both fields are optional per the
plan ("programme/academic route optional filters only") and per
`database_requirements.md`; only Institute Code is mandatory. Root cause:
`FilePickerIcon`'s `disabled` prop and the Upload button's guard/`disabled`
condition were keyed off `!programme` instead of `!instituteCode` - copied
by analogy from Upload Programme Selection, where a programme really is
mandatory, without re-checking that this page's own institute-only
requirement is different. Fixed in
`frontend/app/upload-original-path/page.tsx`: both now key off
`!instituteCode` only; `handleUpload`'s guard likewise drops `!programme`.

**(b) After a View Details resubmit, Upload Summary's "You are logged in
as" institute reset to "no institute selected" instead of showing the
resubmitted record's own institute.** Root cause: every resubmit/bulk-resubmit
call site did `router.push("/upload-summary")` with no query params, and
Upload Summary's institute display is driven entirely by
`institute_code`/`institute_name` query params (there is no session/auth
state in this prototype) - so the context was always dropped on any
navigate-away-and-back action, not just this one code path.

Fixed by resolving the institute from the record just acted on, not from
whatever the user's browsing context happened to be before:
- `backend/app/schemas.py`: `UploadStudentOut` gains `institute_name: str |
  None = None`, resolved server-side in `_to_out()`
  (`backend/app/routers/uploads.py`) via the same `_institute_name()` helper
  `BatchSummaryOut` already uses - symmetric with how `nmc_programmename` is
  already resolved there, and means `GET /api/upload-students/{id}` (View
  Details' own data source) carries everything needed without a second
  fetch. `_institute_name()`'s parameter type widened to `str | None` since
  `nmc_traininginstitutecode` is nullable on `UploadStudent`.
- `frontend/app/lib/types.ts`: `UploadStudent.institute_name` added to
  match. `frontend/app/lib/api.ts`: `ResubmitFullPayload`'s `Omit<...>` list
  extended to exclude it too (it's server-resolved, not part of
  `ResubmitFullRequest`).
- `frontend/app/lib/format.ts`: new `uploadSummaryPath(instituteCode,
  instituteName)` helper - builds the institute-scoped Upload Summary URL,
  falling back to the bare path only if either piece is genuinely missing
  (e.g. a row whose institute code doesn't resolve to a known institute).
  Centralised here rather than duplicated at each call site, and reused by
  every resubmit flow so the fix is consistent across all of them rather
  than View-Details-only:
  - `view-details/page.tsx`: `handleResubmit` now uses
    `uploadSummaryPath(form.nmc_traininginstitutecode, form.institute_name)`.
  - `components/ErrorRecordsSubgrid.tsx`: gained two new required props,
    `instituteCode`/`instituteName`, used the same way in both
    `resubmitBulk` and `resubmitRow` (this fixes the identical bug in the
    other two resubmit flows, which the requester didn't separately report
    but share the exact same root cause). `upload-result/page.tsx` passes
    `batch.nmc_institutecode`/`batch.institute_name` down - both already
    resolved server-side on the batch, so no extra fetch needed there
    either.
- **Verified both fixes are load-bearing, not just visually confirmed**:
  temporarily loosened `uploadSummaryPath`'s guard to `!instituteCode` only
  (dropping the `!instituteName` half) and confirmed
  `format.test.ts`'s new fallback test fails with a URL containing the
  literal string `"institute_name=null"`, then reverted and confirmed
  35/35 passes again.
- Live-verified both fixes end-to-end (Playwright, built frontend + fresh
  seeded DB on port 8008): (a) navigated to Upload-OriginalPath with only an
  institute pre-selected, confirmed "Choose file" and Upload were enabled
  and a real upload succeeded with no programme/route chosen; (b) uploaded a
  mismatch file, opened View Details, corrected the field, clicked
  Resubmit, and confirmed the resulting URL and the on-page "University of
  Chester" text were both correct (not "no institute selected").
- Backend: **58/58** pytest tests pass (added an `institute_name` assertion
  to the existing `test_get_upload_student_returns_row_with_resolved_programme_name`
  test rather than a new one, since it exercises the exact same request).
  Frontend: **35/35** vitest tests pass (2 new `uploadSummaryPath` tests in
  `format.test.ts`; `ErrorRecordsSubgrid.test.tsx` and `api.test.ts`
  fixtures/assertions updated for the new `institute_name` field and the
  bulk-resubmit test's expected navigation URL). `npm run lint` / `npm run
  build` clean.

**Addendum 2 (2026-08-23): two more post-manual-test defects, same root cause**

The requester's next manual test pass found two further defects, both
screenshotted (`myplan/manual_test_screens/defect_c_...png`,
`defect_d_...png`) and both traced to the **same single root cause**, one
call site the previous addendum missed:

**(c) After a successful upload, clicking "Back to Upload Summary" on Upload
Result reset the top-right institute display to "no institute selected".**
**(d) Consequently**, uploading a second file via Alternate Path (Upload
Summary -> Upload file -> Same course -> Upload Programme Selection) landed
on a HEI Programme drop-down with no options at all ("Select a programme"
only), blocking the journey.

Root cause: `upload-result/page.tsx`'s "Back to Upload Summary" `<Link>` was
still `href="/upload-summary"` (bare, no query params) - this is the one
navigate-to-Upload-Summary call site the previous addendum's
`uploadSummaryPath()` fix didn't reach, since that addendum only touched the
three *resubmit* flows (View Details, bulk, single-row), not the plain
"go back" link that fires on every successful upload. With no
`institute_code` in the URL, Upload Summary showed "no institute selected",
and its own "Upload file" link then forwarded that empty `institute_code`
through Upload Path Selection into Upload Programme Selection, whose
`useEffect` guard (`if (!instituteCode) return;`) never calls
`getProgrammeTitles`, leaving the drop-down permanently empty - not a
crash, just silently no options, which is what "blocks the upload journey"
looked like in the screenshot.

**Fix**: `upload-result/page.tsx` - the working "Back to Upload Summary"
link (the one rendered once `batch` has loaded) now uses
`uploadSummaryPath(batch.nmc_institutecode, batch.institute_name)`, the
same helper the previous addendum already introduced and already had a
`BatchDetailOut` field (`institute_name`) to draw from - no new data
needed, this was purely a missed call site. The other "Back to Upload
Summary" link (the "Batch not found" branch, which has no batch data to
draw an institute from) is intentionally left bare - there is nothing to
restore in that case.

Audited every other `router.push`/`<Link href>` in the frontend for the
same class of bug (`grep`'d for `upload-summary`, `upload-path-selection`,
and every `router.push`/`href="/"` call site) and confirmed all of them
already carry `qs`/`institute_code`/`institute_name` forward correctly -
this was the only remaining gap.

No new automated test added for this specific fix: it's the same
already-tested `uploadSummaryPath()` helper (covered by `format.test.ts`)
applied to a call site route-page tests don't otherwise cover in this
codebase (consistent with the existing pattern - `upload-result`,
`upload-path-selection`, `upload-original-path`, `upload-programme-selection`,
and `view-details` have never had dedicated component test files; their
route-level behaviour is verified live). Live-verified instead (Playwright,
built frontend + fresh seeded DB on port 8008), reproducing the exact
reported journey: First Page -> Upload Summary -> Upload file -> Same
course -> pick a programme -> upload a matching file -> Upload Result ->
"Back to Upload Summary" now shows "University of Chester" (not "no
institute selected") and the URL carries `institute_code=1315&institute_name=
University+of+Chester" -> "Upload file" again -> Same course -> Upload
Programme Selection's HEI Programme drop-down now shows all 8 real options,
not empty.

**58/58** backend, **35/35** frontend tests still pass (no fixtures needed
changing this time - the fix touches only a `<Link href>` expression, no new
fields or payload shapes). `npm run lint` / `npm run build` clean.

**Manual test defect-fix round (2026-08-23)** - a further round of manual
testing against the Phase 5 build surfaced 4 defects plus one requested UX
change, all in the Upload Result / View Details area. Root-caused and fixed
each before touching code, per repo convention:

1. **View Details tab 1 (Student Details) - name fields wrong/uneditable**
   (`defect_g_namesField_notEditable.png`). `frontend/app/view-details/page.tsx`
   had two dead placeholder fields left over from the field-mapping table in
   `UI_requirements.md` ("Middle Name - blank", "Previou[s] Last Name -
   blank"): both rendered with `value=""` and `onChange={() => {}}`, so
   nothing typed into them ever showed - not a state bug, just a no-op
   handler. Fixed:
   - "Previous Last Name" relabelled to **Last Name**, now bound to
     `nmc_lastname` (the field already existed on `UploadStudent`/
     `ResubmitFullPayload` - it just wasn't wired to this input), moved to
     directly under First Name.
   - "Middle Name(s)" relabelled to **Middle Name**. No backing field exists
     on `upload_students` for it (confirmed against `app/models.py` and
     `requirements.md`'s file-column-mapping table - the file's own "Middle
     Name" column actually maps to `nmc_maidenname`, a separate UI field),
     so it stays a local-only `useState` field: genuinely editable now,
     but intentionally not part of the Resubmit payload.
   - Maiden Name was already correctly bound and editable in the current
     source - no code change needed there; the defect report's "not
     editable" almost certainly reflected `frontend/out`'s stale prebuilt
     static export lagging the source (fixed by rebuilding, see below).
   - `ViewDetailsField.tsx` also gained a proper `id`/`htmlFor` pairing
     between each label and its input (generated by slugifying the label) -
     labels and inputs were rendered as unassociated siblings, which is
     both an accessibility gap and made these fields untestable via
     `getByLabelText`. Same fix applied to the hand-rolled Date of Birth/
     Gender fields in `view-details/page.tsx`.

2. **View Details tab 3 (Programme Information) - no per-field errors, no
   Institute Code field** (`defect_f_no_erroralerts_fieldsTab3.png`,
   `defect_h_noInstituteCode.png`). Root cause was in the backend, not the
   UI: `app/services/matching.py` checked all 4 programme fields
   (institute code, training type, programme, academic route) as one
   combined check producing a single generic `"Programme does not match
   with organization's record."` message - which `getFieldError()`
   (`frontend/app/lib/format.ts`) can never attach to a specific field,
   because it matches on a `"<Field label> does not match..."` prefix, same
   as every other field. Replaced the combined check with 4 individual
   `FIELD_CHECKS` entries (`Institute code`, `Training type`, `NMC
   programme`, `Academic route`), checked first, same pattern as every
   other field. This does mean a row with several programme-field
   mismatches can now use up more of the 5-slot error cap on programme
   detail than before (previously 1 slot, now up to 4) - accepted as
   correct, since each mismatch is now individually actionable instead of
   a single opaque message.
   `frontend/app/view-details/page.tsx` tab 3 updated to match: added an
   **Institute Code** field (bound to `nmc_traininginstitutecode`, already
   present in `ResubmitFullPayload` - just never exposed in this tab) ahead
   of Training type, and added `error={getFieldError(...)}` to Institute
   Code/Training type/NMC Programme/Academic route, matching how every
   other tab already displays its errors.

3. **Cache issue - deleted Error Records rows reappear after Upload Result
   -> View Details -> back** (`defect_i_...Reactivated.png`,
   `defect_i1_...ThenNotFound.png`). Proved this was frontend-only before
   changing anything: `test_delete_error_row_updates_batch_totals` already
   showed `DELETE /api/upload-students/{id}` hard-deletes the row and a
   subsequent `GET /api/batches/{id}` correctly omits it - no backend
   caching. Root cause is the browser's back/forward cache (bfcache):
   navigating back to a previously-visited page can restore it without
   re-running its data-fetching effect, so Upload Result showed whatever
   `error_records` it last rendered before the user navigated away to View
   Details - which is stale once a Delete (or any other action) has
   happened since. Fixed in `upload-result/page.tsx` and
   `upload-summary/page.tsx`: both now listen for the browser's `pageshow`
   event and re-run their load function whenever `event.persisted` is
   `true` (the standard signal for "this page came from bfcache"), on top
   of the normal on-mount fetch. `upload-result/page.tsx` also now remounts
   `ErrorRecordsSubgrid` (via a `key` bumped on every successful load)
   rather than relying on it to notice a changed `initialRows` prop -
   `useState(initialRows)` only reads its argument on first mount, so
   without the remount a bfcache-triggered re-fetch in the parent would
   still leave the child showing its original (possibly stale) rows. This
   is React's documented pattern for resetting a component's state when
   the data driving it changes, and was chosen over an effect that calls
   `setRows(initialRows)` because that trips the `react-hooks/
   set-state-in-effect` lint rule for the same reason Phase 5's
   Upload-OriginalPath fix avoided it earlier in this phase.

4. **Requested change - Revised Programme column shows programme titles,
   not concatenated codes.** In the Error Records subgrid's per-row
   Revised Programme `<select>` (`ErrorRecordsSubgrid.tsx`), each option
   now reads from `GET /api/programme-titles` (already built in Phase 5
   for Upload Programme Selection - reused here, no backend change) and
   displays the institute's distinct `nmc_aeiprogrammetitle` values instead
   of the `trainingtype-programme-route-programmename` string. The option
   value is `trainingtype|programme|route|title` (title appended only to
   keep two qualification-level variants that share the same
   trainingtype/programme/route - and therefore would share the same
   3-field key - from colliding as duplicate React keys/`<option>` values);
   submission still parses just the first 3 segments via the existing
   `parseProgrammeChoiceKey`, so `resubmitWithProgramme` is unchanged. The
   bulk Revised Programme drop-down above the grid (a separate control,
   not "the column") was intentionally left showing the concatenated
   label, since the requested change named the column specifically.

**Tests**: 3 new backend tests in `test_phase3_matching.py` (training type,
academic route, and multi-programme-subfield-mismatch cases - institute code
and NMC programme mismatches were already covered by existing tests, updated
in place for the new per-field messages), 1 backend assertion text updated in
`test_phase3_uploads_api.py`. **61/61** backend tests pass.
10 new frontend tests (`view-details/page.test.tsx` new - 5 tests;
`upload-result/page.test.tsx` new - 2 tests covering the `pageshow`/bfcache
fix; 3 added to `ErrorRecordsSubgrid.test.tsx` for the programme-titles
column and the remount-on-reload behaviour), 3 existing `ErrorRecordsSubgrid`
tests updated for the new required `programmeTitleChoices` prop. **45/45**
frontend tests pass. `tsc --noEmit` and `next lint` both clean.

**Live-verified** (Playwright, rebuilt `frontend/out` + `uv run uvicorn
app.main:app --port 8008`): uploaded a 2-row original-path file with a
wrong Course Code on row 1 and a wrong Institute Code on row 2 against real
master data, confirming the backend now reports `"NMC programme does not
match..."` and `"Institute code does not match..."` as separate messages;
opened View Details on row 1 and confirmed Last Name/Middle Name/Maiden
Name order and editability, the Institute Code field, and the tab 3 error
message all render as intended; confirmed the per-row Revised Programme
column lists titles like "BN (Hons) Adult Nursing" instead of
"R-AN1-B Nurs (Hons)-Pre-registration nursing - Adult"; then reproduced the
exact reported cache repro (delete row 2 -> View Details on row 1 ->
browser Back) and confirmed row 2 no longer reappears and "Errors" reads 1,
not 2.

**File-upload error handling (2026-08-23)** - added per requirements.md's new
"Error handling at file upload" section, in two rounds.

*Round 1 (backend only)*: `app/services/parsing.py` gained 3 new exception
types (`CorruptedFileError`, `NoDataRowsError`, `WrongColumnHeadersError`,
all subclassing a new `UploadFileError` alongside the existing
`UnsupportedFileTypeError`), each carrying the exact message text from
requirements.md. `_parse_csv`/`_parse_xlsx` now check, in order: (1) can the
file even be read as a spreadsheet (decode/zip/empty-sheet failures -
previously an unhandled 500, e.g. `zipfile.BadZipFile` for a corrupt
`.xlsx`, or `RuntimeError: coroutine raised StopIteration` for a
structurally-valid-but-totally-empty sheet); (2) do the header names cover
every column `FILE_COLUMN_TO_FIELD` needs (checked before row count -
checking row count first would misreport a file with genuinely wrong
headers as "no student record", since none of its rows would map to a
recognized column and would look blank); (3) is there at least one
non-blank data row. `uploads.py`'s `_read_upload` catches the shared
`UploadFileError` base and returns a clean `400` with the message as
`detail` - this all happens before any `UploadBatch`/`UploadStudent` row is
created, satisfying "do not process the file" without extra code. A
header-only file, previously accepted as a valid 0-record batch, is now a
400 - an intentional behavior change per the new spec, so the one existing
test asserting the old behavior was replaced. 61/61 backend tests passed at
this point (3 new in `test_phase3_matching.py`... - see the paragraph
above; this round added 8 in `test_phase3_parsing.py` covering all 3 error
cases for both csv and xlsx, plus 3 API-level tests in
`test_phase3_uploads_api.py`).

*Round 2 (frontend - the actual gap)*: the user tested round 1 against the
real UI and every scenario "failed". Root cause: neither
`upload-original-path/page.tsx` nor `upload-programme-selection/page.tsx`'s
`handleUpload()` had a `catch` block, so a failed `uploadOriginalPath`/
`uploadAlternatePath` call became an unhandled promise rejection - the
button silently reverted to "Upload" with zero visible feedback, backend
fix or not. Confirmed live before changing anything (Playwright): uploading
a bad file produced a console error
(`Error: POST /uploads/original-path failed: 400`) and nothing else
happened on screen. Also, `apiFetch` (`lib/api.ts`) discarded the response
body entirely on a non-ok response, so even a `catch` block would only have
had a generic `"... failed: 400"` string to show, not the backend's actual
message.

**Fix**: `apiFetch` now reads the JSON body of a non-ok response and, if it
has a `detail` string (which every `HTTPException(status_code=..., detail=
...)` response does), throws an `Error` with that text verbatim instead of
the generic fallback. `FilePickerIcon.tsx` gained an optional `error` prop,
rendered as a red `<p>` directly underneath the icon/filename row (same
style `ViewDetailsField` uses) - "underneath the icon" is now literal, not
just "somewhere on the page". Both upload pages: added an `uploadError`
state, set from the `catch` block added to `handleUpload`, cleared whenever
the user picks a new file or changes an upstream selection (institute code,
programme) that would invalidate a stale error, and never touched on
success (the page navigates away instead).

Live-verified (Playwright, rebuilt `frontend/out`) all 3 error messages on
both upload pages, that the message clears on picking a new file, and that
a normal valid upload is unaffected (still navigates to Upload Result).
5 new frontend tests (`api.test.ts` - detail-extraction; `FilePickerIcon.
test.tsx` - error rendering) + 6 new page-level tests (3 each in new
`upload-original-path/page.test.tsx` and `upload-programme-selection/
page.test.tsx` - error shown on failure, error cleared on re-pick, success
still navigates and shows no error). **70/70** backend, **54/54** frontend
tests pass. `tsc --noEmit`, `next lint`, and `next build` all clean.

**Institute-context and cross-institute-history defects (2026-08-23)** - 3
more manual-test defects, 2 of them the same root cause.

**Defects (a)/(b) - resubmitting from View Details after fixing a wrong
Institute Code loses institute context.** Reproduced deliberately before
touching code (Playwright): uploaded a row with an institute code that
doesn't resolve to a real institute (`"Institute code does not match..."`),
opened View Details, corrected the Institute Code field to a real one, and
clicked Resubmit - landed on a bare `/upload-summary` (no query params at
all), confirmed by the "no institute selected" state and, one step further,
by `/upload-programme-selection/?institute_code=&institute_name=` (`qs`
just echoes forward whatever it received at every hop from Upload Summary
through Upload Path Selection to Upload Programme Selection) - explaining
both the empty institute display and the HEI Programme drop-down having no
options (`useEffect(() => { if (!instituteCode) return; ... })` in
`upload-programme-selection/page.tsx` never fires `getProgrammeTitles`
against an empty code).

Root cause: `view-details/page.tsx`'s `handleResubmit` built the redirect
from `form.institute_name` - the value the page loaded with, resolved from
the row's *original* (wrong) institute code. Editing the Institute Code
field only updates `form.nmc_traininginstitutecode` client-side; nothing
re-resolves `form.institute_name` to match, so it stays whatever (often
`null`) the wrong original code resolved to. `uploadSummaryPath()` treats a
`null` institute_name as "no context" and returns a bare `/upload-summary`,
which every downstream `qs`-forwarding page then echoes as empty-but-present
params. Fix: `handleResubmit` now captures `resubmitFull`'s return value
(the server's freshly re-resolved `UploadStudentOut`, which reflects the
*corrected* code) and builds the redirect from that instead of the stale
`form`. Live-reproduced the exact fix end-to-end: same repro steps, redirect
now correctly lands on `/upload-summary?institute_code=1315&institute_name=
University+of+Chester`, and the HEI Programme drop-down on Upload Programme
Selection has all 8 real options again. 1 new frontend test
(`view-details/page.test.tsx`) asserts the redirect uses the resubmit
response's institute fields, not the pre-edit ones.

The other two resubmit paths (bulk/single-row in `ErrorRecordsSubgrid.tsx`)
were not affected - they redirect using the *batch's* own institute (always
a real, form-selected value, never taken from unstructured file data) via
props sourced fresh from `getBatch()`, not a per-row value that can go
stale mid-edit.

**Defect (c) - Upload Summary shows every institute's upload history, not
just the selected one.** `GET /api/batches` never took an institute filter -
`list_batches` selected every `UploadBatch` row unconditionally, and
`upload-summary/page.tsx` called `getBatches()` with no argument. Confirmed
live: switching to Canterbury Christ Church University still listed
University of Chester's batches in the subgrid. Fix: `list_batches` gained
an optional `institute_code` query param, filtering with `.where(...)` only
when provided (omitting it still returns everything, preserving the
existing no-filter behavior for any other caller); `getBatches(instituteCode?)`
in `lib/api.ts` passes it through when given; `upload-summary/page.tsx`
now calls `getBatches(instituteCode)` and re-fetches (effect dependency)
whenever the institute in the URL changes. Live-verified: uploaded a batch
under Canterbury Christ Church University, navigated to its Upload Summary,
and confirmed only that one batch shows - none of the 17 existing
University of Chester batches leak through.

**Tests**: 2 new backend tests (`test_batches_filtered_by_institute_code`,
`test_batches_without_institute_code_returns_every_institute`); 5 new
frontend tests (2 `getBatches` cases in `api.test.ts`, 2 in new
`upload-summary/page.test.tsx`, 1 in `view-details/page.test.tsx` per
above). **72/72** backend, **59/59** frontend tests pass. `tsc --noEmit`
and `next lint` both clean.

**Country of Birth field added to View Details tab 1 (2026-08-23)** -
requested addition, not a defect: `ViewDetails.png`'s diagram showed a
"Country of Birth" field (flagged as a gap in the earlier Phase 6 review)
that was never implemented; the field itself (`nmc_countryofbirthname`)
already existed on `UploadStudent`/`MasterStudent` and in
`ResubmitFullPayload` - it just wasn't shown anywhere.
`view-details/page.tsx` tab 1 now has a **Country of Birth** field directly
underneath Nationality, bound to `nmc_countryofbirthname`, editable, with
its own mismatch error via `getFieldError(form, "Country of birth")` - same
pattern as every other field.

Since the field is now visible/editable, `app/services/matching.py` gained
a matching check for it (`("Country of birth", "nmc_countryofbirthname")`,
positioned right after Nationality in `FIELD_CHECKS`) - the module's own
long-standing comment says fields not shown on View Details aren't checked
"since flagging them would be a dead end"; now that this one is shown, the
same logic that applied to Institute Code earlier applies here. This is a
real (if narrow) behavior change: a row whose Place of Birth doesn't match
the master record, but every other *previously-checked* field does, now
correctly fails instead of silently succeeding. No existing test fixture
had a deliberate Place of Birth mismatch expecting Success, so nothing
broke.

Title stays a free-text field, per explicit instruction - no change made.

**Tests**: 1 new backend test (`test_country_of_birth_mismatch_alone_is_the_only_error`);
3 new frontend tests in `view-details/page.test.tsx` (field present under
Nationality with the right value and editable, field order, mismatch error
displayed). **73/73** backend, **61/61** frontend tests pass. Live-verified
(Playwright, rebuilt `frontend/out`): uploaded a row with a Place of Birth
that doesn't match the master record, confirmed the backend reports
`"Country of birth does not match with organization's record."`, and
confirmed the field renders in the right position with the right value and
that error message underneath it.

### Phase 6 - Testing & Validation
- Manual end-to-end run of both upload paths using `master_students.csv`-derived
  sample files: one file that matches master data (all Success), one with deliberate
  mismatches covering all 5 error slots.
- Verify resubmission flows update `upload_students`/`upload_batches` correctly and
  reflect on Upload Summary.
- Verify View Details field mappings/transforms and inline error display.
- Cross-check UI against each diagram for layout/field parity.

**Status: Complete (2026-08-23)**

Not a single formal pass but the cumulative result of every defect-fix round
logged under Phase 5 above (2026-08-22 through 2026-08-23), each of which
re-ran the relevant slice of this checklist live before and after its fix,
plus the requester's own independent end-to-end testing across multiple
rounds, which found no further issues.

- **Both upload paths, deliberate mismatches, all 5 error slots**: covered
  by the many original-path and alternate-path uploads exercised live across
  every defect-fix round (wrong programme, wrong institute code, wrong
  header, empty/corrupted file, etc.), and by
  `test_multiple_mismatches_are_capped_at_five_in_check_order`
  (`test_phase3_matching.py`) at the unit level, which exercises all 5 error
  slots being populated in check order and capped correctly.
- **Resubmission flows**: all 3 (bulk, single-row, View Details) exercised
  live repeatedly, including the institute-context defects found and fixed
  in this phase (stale institute_name on a corrected Institute Code; batches
  leaking across institutes on Upload Summary).
- **View Details field mappings/transforms and inline error display**:
  verified for all 4 tabs, including the Institute Code and Country of
  Birth fields added during this phase and their own per-field error
  messages - each following the same `getFieldError`/red-text pattern as
  every other field.
- **Diagram cross-check**: performed against every diagram in
  `requirement_doc/diagrams/`. Findings: (1) the reference diagrams are
  screenshots of the real, branded NMC system - `UI_requirements.md`'s
  General Notes already document the deliberate departures (no NMC
  branding, no header/footer links, disabled Search), confirmed by the
  requester as intentional, no action needed; (2) `ViewDetails.png` showed
  a separate "Previous Last Name" field alongside "Last Name" - the
  requester confirmed the current single merged field is intentional,
  leave as-is; (3) `ViewDetails.png`'s "Country of Birth" field was missing
  entirely - added (see the dedicated addendum above); (4) Title remains a
  free-text field (diagram shows a dropdown) - requester confirmed this
  should stay free-text.

### Phase 7 - Cloud Deployment Readiness
- Confirm every environment-specific value (DB file path, host, port, base URL) comes
  from `.env` / environment variables, not hardcoded `localhost` references, so the
  same build runs locally and on a cloud webserver unchanged.
- Produce the production build path: `next build` (static export) into
  `frontend/out`, then run the single `uv run uvicorn app.main:app --host 0.0.0.0
  --port 8008` process and verify the full user journey works through that one port,
  matching how it will run in the cloud.
- Document the SQLite caveat for cloud hosting: the DB file must sit on persistent
  storage if the container/host filesystem is ephemeral, otherwise uploaded batches
  reset on redeploy/restart - acceptable for a prototype but worth calling out
  explicitly.
- Note (do not build yet) that "limited users" access in the cloud is expected to be
  an infrastructure-level control in front of the single port - e.g. a reverse-proxy
  allowlist or basic auth - decided when a hosting target is chosen, and kept
  separate from the app's own no-authentication requirement.

**Status: Complete (2026-08-23)**

- **Environment-driven config, no hardcoded `localhost`**: `backend/app/db.py`
  reads `DATABASE_URL` from the environment (`os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")`),
  falling back to a local file only when unset; `frontend/app/lib/api.ts`
  calls relative `/api/...` paths with no base URL, so the same static
  export works unchanged behind any host. Repo-wide grep for `localhost`
  outside test files and this plan/testing-guide's own doc examples
  returned nothing.
- **Production build path**: `next build` -> `frontend/out` + `uv run
  uvicorn app.main:app --port <N>` was the actual mechanism used to
  live-verify every fix in this phase and Phase 5 - run successfully well
  over a dozen times across defect-fix rounds this session, each time
  serving the full app (API + static frontend) through the one port with no
  separate dev server. `--host 0.0.0.0` specifically (vs. the default
  localhost-only bind used for local verification) was not re-tested this
  session, but is an unchanged, already-parameterized flag on the same
  command - not new surface area.
- **SQLite persistence caveat**: already documented above, and consistent
  with observed behavior - `create_db_and_tables()` (`app/db.py`) only seeds
  `programmes`/`master_students` when those tables are empty, so deleting
  the DB file and restarting reproduces a fresh-deploy-on-ephemeral-storage
  scenario correctly by design (relied on implicitly every time a throwaway
  verification server was started this session).
- **"Limited users" access**: correctly left as an infrastructure-level
  decision per the plan, not built - no change.

**Error Records subgrid: removed per-row checkboxes (2026-08-23)** - business
decision after review: individual row selection was redundant, since every
row already has its own Revised Programme drop-down + Resubmit button for
fixing that row on its own. `ErrorRecordsSubgrid.tsx`'s leftmost checkbox
column (and its table header cell) removed from each row; `toggleOne` (the
now-unused per-row toggle handler) removed with it. The bulk "select all"
checkbox, bulk Revised Programme drop-down, and Submit button above the
subgrid (Enhancement 1 in `UI_requirements.md`) were kept as-is per explicit
instruction - "select all" is now the *only* selection control left, so it
behaves as a single on/off toggle for "every row in the subgrid" vs. "none",
rather than reflecting/driving individual row checkboxes. This is a real,
narrow behavior change: the bulk action can no longer be applied to an
arbitrary subset of rows, only to all of them at once - accepted as correct
per the business decision.

**Tests**: 2 existing tests in `ErrorRecordsSubgrid.test.tsx` that depended
on a per-row checkbox rewritten - one now asserts there is exactly one
checkbox in the whole component (select-all) and that it starts unchecked;
the bulk-resubmit test now selects via "select all" instead of an
individual row checkbox (necessarily now covering all rows in the grid,
since there's no other way to select a subset). **62/62** frontend tests
pass (backend untouched, still 73/73). `tsc --noEmit` and `next lint`
clean. Live-verified (Playwright, rebuilt `frontend/out`): a 2-row error
batch shows no checkboxes in either row; "select all" -> pick a programme
-> Submit fixes both rows via the bulk endpoint exactly as before.

### Phase 8 - Prototype Polish
- Final pass on spacing/layout consistency across all pages.
- Confirm no NMC branding, header/footer links, or working Search remain.
- Clean up seed/reset scripts so the demo database can be rebuilt easily for repeat
  demonstrations.
