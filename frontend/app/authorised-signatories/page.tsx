"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "../components/PageShell";
import { primaryButtonClass } from "../components/buttonStyles";
import { signatoryNameLabel } from "../lib/format";
import { MOCK_SIGNATORIES } from "./mockData";

// Phase 3: mock data only - see mockData.ts. Phase 4 swaps MOCK_SIGNATORIES
// for a real GET /api/signatories?active=... fetch without changing any
// field names (lib/types.ts already mirrors the backend schema).

type Toggle = "Active" | "Inactive";

function LinesList({ values }: { values: string[] }) {
  // "separated by new line" per UI_requirements.md's subgrid column mapping -
  // plain stacked text, distinct from the chip-style TagList used on View
  // Details/Add Signatory step 2's static field block.
  if (values.length === 0) return <span className="text-brand-disabled-text">-</span>;
  return (
    <div>
      {values.map((value, index) => (
        <div key={`${value}-${index}`}>{value}</div>
      ))}
    </div>
  );
}

function RowActions({ pin, active }: { pin: string; active: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        aria-label={`Actions for ${pin}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded border border-brand-border hover:bg-brand-disabled-bg"
      >
        ▾
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 rounded border border-brand-border bg-white py-1 shadow-lg">
          <Link
            href={`/authorised-signatories/view-details?pin=${encodeURIComponent(pin)}`}
            className="block px-3 py-2 text-sm text-brand-accent hover:bg-brand-disabled-bg"
          >
            View Details
          </Link>
          <Link
            href={`/authorised-signatories/view-audits?pin=${encodeURIComponent(pin)}`}
            className="block px-3 py-2 text-sm text-brand-accent hover:bg-brand-disabled-bg"
          >
            View Audits
          </Link>
          {active && (
            <button
              type="button"
              // Dead link per developmentplan_AS.md - "Remove Signatory" performs
              // no deletion in this prototype, so this intentionally has no effect
              // beyond closing the menu.
              onClick={() => setOpen(false)}
              className="block w-full px-3 py-2 text-left text-sm text-brand-error hover:bg-brand-disabled-bg"
            >
              Remove Signatory
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuthorisedSignatoriesPage() {
  const [toggle, setToggle] = useState<Toggle>("Active");
  const rows = MOCK_SIGNATORIES.filter((s) => s.nmc_active === (toggle === "Active" ? "Yes" : "No"));

  return (
    <PageShell>
      <h1 className="mb-1 text-xl font-bold">Authorised Signatories Admin</h1>
      <p className="mb-6 text-sm">
        Below are the list of authorised signatories that the AEI have been notified that can provide a
        declaration of good health and good character.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filter-aei" className="mb-1 block text-sm font-medium">
            AEI
          </label>
          <input id="filter-aei" type="text" className="rounded border border-brand-border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="filter-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input id="filter-name" type="text" className="rounded border border-brand-border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="filter-pin" className="mb-1 block text-sm font-medium">
            NMC PIN
          </label>
          <input id="filter-pin" type="text" className="rounded border border-brand-border px-3 py-2" />
        </div>
        <button type="button" className={primaryButtonClass}>
          Search Signatories
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label htmlFor="toggle-active-inactive" className="sr-only">
          Active or Inactive Signatories
        </label>
        <select
          id="toggle-active-inactive"
          value={toggle}
          onChange={(e) => setToggle(e.target.value as Toggle)}
          className="rounded border border-brand-border px-3 py-2 font-semibold text-brand-header"
        >
          <option value="Active">Active Signatories</option>
          <option value="Inactive">Inactive Signatories</option>
        </select>
        <Link href="/authorised-signatories/add-signatory" className={primaryButtonClass}>
          Add new signatory
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Approved course title</th>
              <th className="py-2 pr-4">Practice Type</th>
              <th className="py-2 pr-4">Register Part</th>
              <th className="py-2 pr-4">Registration expiry date</th>
              <th className="py-2 pr-4">Date Created</th>
              <th className="py-2 pr-4">By Who</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.nmc_pin} className="border-b border-brand-border">
                <td className="py-2 pr-4">{signatoryNameLabel(row)}</td>
                <td className="py-2 pr-4">{row.approved_course_title}</td>
                <td className="py-2 pr-4">
                  <LinesList values={row.practice_types} />
                </td>
                <td className="py-2 pr-4">
                  <LinesList values={row.register_parts} />
                </td>
                <td className="py-2 pr-4">{row.nmc_regexpirydate}</td>
                <td className="py-2 pr-4">{row.nmc_createdon}</td>
                <td className="py-2 pr-4">{row.nmc_addedby}</td>
                <td className="py-2 pr-4">
                  <RowActions pin={row.nmc_pin} active={toggle === "Active"} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-brand-disabled-text">
                  There are no records to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
