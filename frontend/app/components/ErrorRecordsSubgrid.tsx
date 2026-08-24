"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nameLabel, programmeTitleLabel, rowProgrammeLabel, toBritishDateTime, uploadSummaryPath } from "../lib/format";
import { deleteUploadStudent, resubmitWithProgramme } from "../lib/api";
import type { ProgrammeTitleChoice, UploadStudent } from "../lib/types";
import { primaryButtonClass } from "./buttonStyles";

interface Props {
  initialRows: UploadStudent[];
  programmeTitleChoices: ProgrammeTitleChoice[];
  instituteCode: string;
  instituteName: string | null;
}

// Includes the title so two qualification-level variants sharing the same
// (trainingtype, programme, academicroute) triple still get distinct <option>
// keys/values - parseProgrammeChoiceKey only reads the first 3 segments, so
// the trailing title segment is ignored on submission.
function programmeTitleChoiceKey(choice: ProgrammeTitleChoice): string {
  return `${choice.nmc_trainingtype}|${choice.nmc_programme}|${choice.nmc_academicroute}|${choice.nmc_aeiprogrammetitle}`;
}

function parseProgrammeChoiceKey(key: string): {
  nmc_trainingtype: string;
  nmc_programme: string;
  nmc_academicroute: string;
} {
  const [nmc_trainingtype, nmc_programme, nmc_academicroute] = key.split("|");
  return { nmc_trainingtype, nmc_programme, nmc_academicroute };
}

export default function ErrorRecordsSubgrid({
  initialRows,
  programmeTitleChoices,
  instituteCode,
  instituteName,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRevisedProgramme, setBulkRevisedProgramme] = useState("");
  const [rowRevisedProgramme, setRowRevisedProgramme] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function resubmitBulk() {
    if (selectedIds.size === 0 || !bulkRevisedProgramme) return;
    setSubmitting(true);
    try {
      await resubmitWithProgramme({
        uploadStudentIds: [...selectedIds],
        ...parseProgrammeChoiceKey(bulkRevisedProgramme),
      });
      router.push(uploadSummaryPath(instituteCode, instituteName));
    } finally {
      setSubmitting(false);
    }
  }

  async function resubmitRow(id: number) {
    const key = rowRevisedProgramme[id];
    if (!key) return;
    setSubmitting(true);
    try {
      await resubmitWithProgramme({
        uploadStudentIds: [id],
        ...parseProgrammeChoiceKey(key),
      });
      router.push(uploadSummaryPath(instituteCode, instituteName));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteRow(id: number) {
    await deleteUploadStudent(id);
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
            {programmeTitleChoices.map((choice) => (
              <option key={programmeTitleChoiceKey(choice)} value={programmeTitleChoiceKey(choice)}>
                {programmeTitleLabel(choice)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={selectedIds.size === 0 || !bulkRevisedProgramme || submitting}
            onClick={resubmitBulk}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto overflow-x-auto rounded border border-brand-border">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-brand-border text-left">
              <th className="w-24 px-2 py-2 text-center" />
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
                <td className="w-24 px-2 py-2 text-center">{index + 1}</td>
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
                    {programmeTitleChoices.map((choice) => (
                      <option key={programmeTitleChoiceKey(choice)} value={programmeTitleChoiceKey(choice)}>
                        {choice.nmc_aeiprogrammetitle}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    disabled={!rowRevisedProgramme[row.id] || submitting}
                    onClick={() => resubmitRow(row.id)}
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
                <td colSpan={14} className="py-4 text-center text-brand-disabled-text">
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
