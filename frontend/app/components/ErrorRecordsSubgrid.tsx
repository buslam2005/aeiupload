"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nameLabel, rowProgrammeLabel, toBritishDateTime } from "../lib/format";
import type { ProgrammeChoice, UploadStudent } from "../lib/types";
import { primaryButtonClass } from "./buttonStyles";

interface Props {
  initialRows: UploadStudent[];
  programmeChoices: ProgrammeChoice[];
}

function programmeChoiceKey(choice: ProgrammeChoice): string {
  return `${choice.nmc_trainingtype}|${choice.nmc_programme}|${choice.nmc_academicroute}`;
}

export default function ErrorRecordsSubgrid({ initialRows, programmeChoices }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRevisedProgramme, setBulkRevisedProgramme] = useState("");
  const [rowRevisedProgramme, setRowRevisedProgramme] = useState<Record<number, string>>({});

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resubmit() {
    // Phase 5 will POST to /api/upload-students/resubmit-with-programme here,
    // with the selected row id(s) and the chosen revised programme. Phase 4
    // has no backend wiring yet - the spec's own end state for this action is
    // "user is directed to Upload Summary page", so that's what we
    // demonstrate structurally.
    router.push("/upload-summary");
  }

  function deleteRow(id: number) {
    // Phase 5 will DELETE /api/upload-students/{id} here.
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div>
      <h2 className="mb-2 font-bold">Error Records</h2>

      <div className="mb-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          select all
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label htmlFor="bulk-revised-programme" className="font-medium">
            Revised Programme
          </label>
          <select
            id="bulk-revised-programme"
            className="rounded border border-brand-border px-2 py-1"
            value={bulkRevisedProgramme}
            onChange={(e) => setBulkRevisedProgramme(e.target.value)}
          >
            <option value="">Select a programme</option>
            {programmeChoices.map((choice) => (
              <option key={programmeChoiceKey(choice)} value={programmeChoiceKey(choice)}>
                {`${choice.nmc_trainingtype}-${choice.nmc_programme}-${choice.nmc_academicroute}-${choice.nmc_programmename}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={selectedIds.size === 0 || !bulkRevisedProgramme}
            onClick={resubmit}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto overflow-x-auto rounded border border-brand-border">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-brand-border text-left">
              <th className="py-2 pr-2" />
              <th className="py-2 pr-4" />
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">NMC PIN</th>
              <th className="py-2 pr-4">Created On</th>
              <th className="py-2 pr-4">Message Type</th>
              <th className="py-2 pr-4">Type Error</th>
              <th className="py-2 pr-4">Status Reason</th>
              <th className="py-2 pr-4">Programme</th>
              <th className="py-2 pr-4">Training Type</th>
              <th className="py-2 pr-4">Course Code</th>
              <th className="py-2 pr-4">Academic Route</th>
              <th className="py-2 pr-4">Revised Programme</th>
              <th className="py-2 pr-4" />
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-brand-border">
                <td className="py-2 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                  />
                </td>
                <td className="py-2 pr-4">{index + 1}</td>
                <td className="py-2 pr-4">{nameLabel(row)}</td>
                <td className="py-2 pr-4">{row.nmc_nmcpin}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{toBritishDateTime(row.nmc_rowuploadtime)}</td>
                <td className="py-2 pr-4">Error</td>
                <td className="py-2 pr-4">Severe</td>
                <td className="py-2 pr-4">Failed</td>
                <td className="py-2 pr-4">{rowProgrammeLabel(row) ?? "-"}</td>
                <td className="py-2 pr-4">{row.nmc_trainingtype}</td>
                <td className="py-2 pr-4">{row.nmc_programme}</td>
                <td className="py-2 pr-4">{row.nmc_academicroute}</td>
                <td className="py-2 pr-4">
                  <select
                    className="rounded border border-brand-border px-2 py-1"
                    value={rowRevisedProgramme[row.id] ?? ""}
                    onChange={(e) =>
                      setRowRevisedProgramme((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                  >
                    <option value="">Select a programme</option>
                    {programmeChoices.map((choice) => (
                      <option key={programmeChoiceKey(choice)} value={programmeChoiceKey(choice)}>
                        {`${choice.nmc_trainingtype}-${choice.nmc_programme}-${choice.nmc_academicroute}-${choice.nmc_programmename}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    disabled={!rowRevisedProgramme[row.id]}
                    onClick={resubmit}
                  >
                    Resubmit
                  </button>
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <a href={`/view-details?studentId=${row.id}`} className="mr-3 text-brand-accent underline">
                    View Details
                  </a>
                  <button
                    type="button"
                    className="text-brand-error underline"
                    onClick={() => deleteRow(row.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={15} className="py-4 text-center text-brand-disabled-text">
                  There are no records to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
