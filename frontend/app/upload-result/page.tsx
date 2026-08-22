"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import ErrorRecordsSubgrid from "../components/ErrorRecordsSubgrid";
import { primaryButtonClass } from "../components/buttonStyles";
import { nameLabel, toBritishDateTime, uploadSummaryPath } from "../lib/format";
import { getBatch, getProgrammes } from "../lib/api";
import type { BatchDetail, ProgrammeChoice } from "../lib/types";

function UploadResultContent() {
  const searchParams = useSearchParams();
  const batchId = Number(searchParams.get("batchId"));

  const [batch, setBatch] = useState<BatchDetail | null | undefined>(undefined);
  const [programmeChoices, setProgrammeChoices] = useState<ProgrammeChoice[]>([]);

  useEffect(() => {
    getBatch(batchId)
      .then((data) => {
        setBatch(data);
        return getProgrammes(data.nmc_institutecode);
      })
      .then((choices) => choices && setProgrammeChoices(choices))
      .catch(() => setBatch(null));
  }, [batchId]);

  if (batch === undefined) {
    return (
      <PageShell>
        <p>Loading...</p>
      </PageShell>
    );
  }

  if (!batch) {
    return (
      <PageShell>
        <p>Batch not found.</p>
        <Link href="/upload-summary" className={primaryButtonClass}>
          Back to Upload Summary
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        href={uploadSummaryPath(batch.nmc_institutecode, batch.institute_name)}
        className={`${primaryButtonClass} mb-6 inline-flex`}
      >
        Back to Upload Summary
      </Link>

      <div className="mb-8 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
        <div>
          <div className="font-bold">Uploaded By</div>
          <div>{batch.nmc_uploadby}</div>
        </div>
        <div>
          <div className="font-bold">Institute Code</div>
          <div>{batch.nmc_institutecode}</div>
        </div>
        <div>
          <div className="font-bold">Total Records</div>
          <div>{batch.nmc_totalrecords}</div>
        </div>

        <div>
          <div className="font-bold">Batch ID</div>
          <div>{batch.nmc_uploadbatchid}</div>
        </div>
        <div>
          <div className="font-bold">Programme</div>
          <div>{batch.nmc_programme ?? "-"}</div>
        </div>
        <div>
          <div className="font-bold">Successes</div>
          <div>{batch.nmc_totalsuccessrecords}</div>
        </div>

        <div>
          <div className="font-bold">File</div>
          <div>{batch.nmc_filename}</div>
        </div>
        <div>
          <div className="font-bold">Academic Route</div>
          <div>{batch.nmc_academicroute ?? "-"}</div>
        </div>
        <div>
          <div className="font-bold">Errors</div>
          <div>{batch.nmc_totalfailedrecords}</div>
        </div>
      </div>

      <h2 className="mb-2 font-bold">Uploaded Records</h2>
      <div className="mb-8 max-h-56 overflow-y-auto rounded border border-brand-border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-brand-border text-left">
              <th className="py-2 pr-4">Line Number</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">NMC PIN</th>
              <th className="py-2 pr-4">Created On</th>
              <th className="py-2 pr-4">Programme</th>
            </tr>
          </thead>
          <tbody>
            {batch.uploaded_records.map((row) => (
              <tr key={row.id} className="border-b border-brand-border">
                <td className="py-2 pr-4">{row.nmc_linenumber}</td>
                <td className="py-2 pr-4">{nameLabel(row)}</td>
                <td className="py-2 pr-4">{row.nmc_nmcpin}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{toBritishDateTime(row.nmc_rowuploadtime)}</td>
                <td className="py-2 pr-4">{row.nmc_programmename ?? "-"}</td>
              </tr>
            ))}
            {batch.uploaded_records.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-brand-disabled-text">
                  There are no records to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ErrorRecordsSubgrid
        initialRows={batch.error_records}
        programmeChoices={programmeChoices}
        instituteCode={batch.nmc_institutecode}
        instituteName={batch.institute_name}
      />
    </PageShell>
  );
}

export default function UploadResultPage() {
  return (
    <Suspense>
      <UploadResultContent />
    </Suspense>
  );
}
