# Demo Data Reset Guide

Two scripts, both in `backend/app/scripts/`, cover the two things you'd want
to reset before/between demos. Both act on the local SQLite file
(`backend/data/aei_upload.db`) and refuse to run against a non-default
`DATABASE_URL` rather than guessing.

Run them from `backend/`, with the server **stopped first** - both write
directly to the database file, and doing that while `uvicorn` also holds it
open is asking for trouble.

## `reset-db` - full rebuild

```bash
cd backend
uv run python -m app.scripts.reset_db
```

What it does:
1. Deletes `data/aei_upload.db` if it exists.
2. Recreates the schema and reseeds `programmes` and `master_students` from
   `app/seed_data/*.csv` - the same thing that happens automatically the
   first time the app starts against a missing database file.
3. `upload_batches`/`upload_students` end up empty, since nothing seeds
   those - they only ever contain real uploads.

Use this when you want a completely clean slate: no upload history, and
`programmes`/`master_students` back to exactly what's in the CSVs (in case
you edited data mid-demo, or just want a known-good baseline).

Prints a summary line with the row counts it reseeded, so you can confirm it
worked.

## `purge-uploads` - upload history only

```bash
cd backend
uv run python -m app.scripts.purge_uploads
```

What it does: deletes every row from `upload_students` and `upload_batches`
only. `programmes` and `master_students` are left exactly as they are.

Use this between demo runs on the same day, when you've uploaded a bunch of
test files and just want Upload Summary to show nothing again, without
paying the cost of re-seeding the (much larger) reference tables. It's also
what you'd reach for if you've deliberately edited a `master_students` row
mid-demo (e.g. to set up a specific mismatch scenario) and don't want
`reset-db` to overwrite that edit.

Batch/student IDs start again from 1 after this, the same as after a full
`reset-db` - SQLite reuses the lowest available row id once a table is
empty, so there's no separate "reset the counter" step needed.

## Which one to use

| Situation | Script |
|---|---|
| Before a demo, want a totally clean start | `reset-db` |
| Between runs same day, reference data hasn't changed | `purge-uploads` |
| You edited `master_students`/`programmes` and want the CSVs back | `reset-db` |
| You edited `master_students`/`programmes` and want to *keep* the edit | `purge-uploads` |

## Safety notes

- Both are destructive and irreversible - there's no undo, no confirmation
  prompt (by design, so they're quick to run) and no backup taken. Only run
  them when you're sure.
- Both refuse to run if `DATABASE_URL` has been overridden away from the
  default local SQLite file, rather than deleting/purging something they
  don't know the shape of.
- Neither touches anything outside the database - uploaded files themselves
  aren't stored on disk (the app only ever reads them once, at upload time),
  so there's nothing else to clean up.
