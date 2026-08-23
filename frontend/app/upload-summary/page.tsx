"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import { disabledButtonClass, primaryButtonClass } from "../components/buttonStyles";
import { SearchIcon } from "../components/icons";
import { toBritishDateTime } from "../lib/format";
import { getBatches } from "../lib/api";
import type { BatchSummary } from "../lib/types";

function UploadSummaryContent() {
  const searchParams = useSearchParams();
  const instituteCode = searchParams.get("institute_code") ?? "";
  const instituteName = searchParams.get("institute_name") ?? "";

  const [batches, setBatches] = useState<BatchSummary[]>([]);

  useEffect(() => {
    function load() {
      getBatches().then(setBatches);
    }

    load();

    // See upload-result/page.tsx - browsers can restore this page from the
    // back/forward cache (bfcache) without re-running the fetch above.
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) load();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const mostRecent = batches[0];

  return (
    <PageShell>
      <div className="mb-6 flex flex-col items-end text-right">
        <p>
          You are logged in as <span className="font-semibold">User1</span>,
        </p>
        <div className="flex items-center gap-3">
          <span className="font-semibold">{instituteName || "no institute selected"}</span>
          <Link href="/" className={primaryButtonClass}>
            Change
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <span>Please select a student qualifications file to upload:</span>
        <Link
          href={`/upload-path-selection?institute_code=${instituteCode}&institute_name=${encodeURIComponent(instituteName)}`}
          className={primaryButtonClass}
        >
          Upload file
        </Link>
      </div>

      <h2 className="mb-2 font-bold">Upload Summary</h2>
      <div className="mb-6 min-h-12 rounded border border-brand-border bg-brand-info-bg p-4 text-sm">
        {mostRecent ? (
          <p>
            Batch <strong>{mostRecent.nmc_uploadbatchid}</strong> ({mostRecent.nmc_filename}):{" "}
            {mostRecent.nmc_totalsuccessrecords} success, {mostRecent.nmc_totalfailedrecords}{" "}
            error(s). Status: {mostRecent.status}.
          </p>
        ) : (
          <p>No previous uploads.</p>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <button type="button" disabled className={disabledButtonClass}>
          Advanced Search
        </button>
        <input
          type="search"
          disabled
          aria-label="Search"
          className="rounded border border-brand-border bg-brand-disabled-bg px-3 py-2 text-brand-disabled-text"
        />
        <button
          type="button"
          disabled
          aria-label="Search"
          className="rounded border border-brand-border bg-brand-disabled-bg p-2 text-brand-disabled-text disabled:cursor-not-allowed"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left">
              <th className="py-2 pr-4">Batch ID</th>
              <th className="py-2 pr-4">Requested On</th>
              <th className="py-2 pr-4">AEI</th>
              <th className="py-2 pr-4">Uploaded By</th>
              <th className="py-2 pr-4">File</th>
              <th className="py-2 pr-4">Total Records</th>
              <th className="py-2 pr-4">Successes</th>
              <th className="py-2 pr-4">Error</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.nmc_uploadbatchid} className="border-b border-brand-border">
                <td className="py-2 pr-4">{batch.nmc_uploadbatchid}</td>
                <td className="py-2 pr-4">{toBritishDateTime(batch.nmc_uploadbatchtime)}</td>
                <td className="py-2 pr-4">{batch.institute_name}</td>
                <td className="py-2 pr-4">{batch.nmc_uploadby}</td>
                <td className="py-2 pr-4">{batch.nmc_filename}</td>
                <td className="py-2 pr-4">{batch.nmc_totalrecords}</td>
                <td className="py-2 pr-4">{batch.nmc_totalsuccessrecords}</td>
                <td className="py-2 pr-4">{batch.nmc_totalfailedrecords}</td>
                <td className="py-2 pr-4">{batch.status}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/upload-result?batchId=${batch.nmc_uploadbatchid}`}
                    className="text-brand-accent underline"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function UploadSummaryPage() {
  return (
    <Suspense>
      <UploadSummaryContent />
    </Suspense>
  );
}
