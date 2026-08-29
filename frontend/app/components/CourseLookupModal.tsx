"use client";

import { useState } from "react";
import type { CourseChoice } from "../lib/types";
import { primaryButtonClass } from "./buttonStyles";
import { SearchIcon } from "./icons";

// Shared "Lookup records" pop-up (CourseLookupRecords.png), reused by View
// Details and Add Signatory step 2. Institute-scoping is the caller's job
// (it passes in only that institute's choices) - this component just renders
// them, paginated, single-select.

const PAGE_SIZE = 5;

function choiceKey(choice: CourseChoice): string {
  return `${choice.nmc_trainingtype}|${choice.nmc_programme}|${choice.nmc_academicroute}|${choice.nmc_qualificationlevel}`;
}

interface Props {
  open: boolean;
  choices: CourseChoice[];
  onAdd: (choice: CourseChoice) => void;
  onClose: () => void;
}

export default function CourseLookupModal({ open, choices, onAdd, onClose }: Props) {
  // Mounted only while open, so its selection/page state initializes fresh
  // every time it's reopened - no reset-on-prop-change effect needed.
  if (!open) return null;
  return <CourseLookupModalContent choices={choices} onAdd={onAdd} onClose={onClose} />;
}

function CourseLookupModalContent({ choices, onAdd, onClose }: Omit<Props, "open">) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(choices.length / PAGE_SIZE));
  const pageChoices = choices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleAdd() {
    const choice = choices.find((c) => choiceKey(c) === selectedKey);
    if (!choice) return;
    onAdd(choice);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between border-b border-brand-border pb-3">
          <h2 className="text-lg font-bold">Lookup records</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded bg-brand-accent font-bold text-white hover:bg-brand-accent-hover"
          >
            X
          </button>
        </div>

        <div className="mb-3 flex justify-end gap-2">
          <input
            type="search"
            disabled
            aria-label="Search"
            className="rounded border border-brand-border bg-brand-disabled-bg px-3 py-1.5 text-brand-disabled-text"
          />
          <button
            type="button"
            disabled
            aria-label="Search"
            className="rounded border border-brand-border bg-brand-disabled-bg p-2 text-brand-disabled-text disabled:cursor-not-allowed"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-header text-left text-white">
                <th className="w-16 px-2 py-2 text-center">Select</th>
                <th className="px-2 py-2">Programme Title</th>
                <th className="px-2 py-2">Training Type Code</th>
                <th className="px-2 py-2">Programme Code</th>
                <th className="px-2 py-2">Academic Level</th>
                <th className="px-2 py-2">Qualification Route</th>
              </tr>
            </thead>
            <tbody>
              {pageChoices.map((choice) => {
                const key = choiceKey(choice);
                return (
                  <tr key={key} className="border-b border-brand-border">
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select ${choice.nmc_programmename} - ${choice.nmc_qualificationlevelname}`}
                        checked={selectedKey === key}
                        onChange={() => setSelectedKey(selectedKey === key ? null : key)}
                      />
                    </td>
                    <td className="px-2 py-2">{choice.nmc_programmename}</td>
                    <td className="px-2 py-2">{choice.nmc_trainingtype}</td>
                    <td className="px-2 py-2">{choice.nmc_programme}</td>
                    <td className="px-2 py-2">{choice.nmc_academicroute}</td>
                    <td className="px-2 py-2">{choice.nmc_qualificationlevelname}</td>
                  </tr>
                );
              })}
              {pageChoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-brand-disabled-text">
                    There are no records to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={page === n ? "page" : undefined}
                className={`h-7 w-7 rounded text-sm font-semibold ${
                  page === n ? "bg-brand-accent text-white" : "text-brand-accent hover:bg-brand-disabled-bg"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" className={primaryButtonClass} disabled={!selectedKey} onClick={handleAdd}>
              Add
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded border border-brand-border px-5 py-2 font-semibold hover:bg-brand-disabled-bg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
