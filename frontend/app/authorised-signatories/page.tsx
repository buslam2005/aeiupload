"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "../components/PageShell";
import { primaryButtonClass } from "../components/buttonStyles";
import { signatoryNameLabel } from "../lib/format";
import { getSignatories } from "../lib/api";
import type { SignatoryListItem } from "../lib/types";

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

const MENU_WIDTH = 160; // matches w-40 below

function RowActions({ pin, active }: { pin: string; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The subgrid now scrolls (see "at most 10 rows" above) - an
  // absolutely-positioned menu would be clipped by that scroll container for
  // rows near the bottom, so this is fixed-positioned from the trigger's
  // viewport rect instead, which escapes the clip. Closes on the page's own
  // scroll/resize rather than re-tracking the trigger, since this is a
  // one-shot open, not a persistently-anchored popover.
  //
  // Listener attachment is deferred one tick: opening the menu for a row
  // that wasn't fully in view (e.g. reached via keyboard, or a click that
  // itself triggers the browser's scroll-into-view) causes a real window
  // scroll that lands in the same tick as the click - attaching immediately
  // caught that same scroll and closed the menu before it was ever visible.
  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    const id = window.setTimeout(() => {
      window.addEventListener("scroll", close);
      window.addEventListener("resize", close);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${pin}`}
        aria-expanded={open}
        onClick={toggleOpen}
        className="flex h-8 w-8 items-center justify-center rounded border border-brand-border hover:bg-brand-disabled-bg"
      >
        ▾
      </button>
      {open && menuPos && (
        <div
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
          className="z-10 rounded border border-brand-border bg-white py-1 shadow-lg"
        >
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
  const [rows, setRows] = useState<SignatoryListItem[]>([]);

  useEffect(() => {
    function load() {
      getSignatories(toggle === "Active" ? "Yes" : "No").then(setRows);
    }

    load();

    // See upload-summary/page.tsx - browsers can restore this page from the
    // back/forward cache (bfcache) without re-running the fetch above, which
    // would otherwise show a stale "Approved course title" after a course
    // add/remove on View Details.
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) load();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [toggle]);

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

      {/* At most 10 rows visible, infinite vertical scroll beyond that - same
          convention as ErrorRecordsSubgrid.tsx's scrollable subgrid. */}
      <div className="max-h-[720px] overflow-y-auto overflow-x-auto rounded border border-brand-border">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
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
