"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../../components/PageShell";
import { primaryButtonClass } from "../../components/buttonStyles";
import { SearchIcon } from "../../components/icons";
import { toBritishDateTime } from "../../lib/format";
import { MOCK_AUDITS } from "../mockData";

const PAGE_SIZE = 5;

function ViewAuditsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") ?? "";
  const [page, setPage] = useState(1);

  const rows = [...(MOCK_AUDITS[pin] ?? [])].sort((a, b) => b.nmc_modifiedon.localeCompare(a.nmc_modifiedon));
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold">Audit</h1>

      <div className="mb-4 flex justify-start gap-2">
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
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left">
              <th className="py-2 pr-4">Modified On</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Old Value</th>
              <th className="py-2 pr-4">New Value</th>
              <th className="py-2 pr-4">Modified By</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="border-b border-brand-border">
                <td className="py-2 pr-4 whitespace-nowrap">{toBritishDateTime(row.nmc_modifiedon)}</td>
                <td className="py-2 pr-4">{row.nmc_attributechanged}</td>
                <td className="py-2 pr-4">{row.nmc_previousvalue || "-"}</td>
                <td className="py-2 pr-4">{row.nmc_newvalue || "-"}</td>
                <td className="py-2 pr-4">{row.nmc_addedby}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-brand-disabled-text">
                  There are no audit records to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-1">
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

      <div className="mt-6">
        <button type="button" className={primaryButtonClass} onClick={() => router.back()}>
          Previous
        </button>
      </div>
    </PageShell>
  );
}

export default function ViewAuditsPage() {
  return (
    <Suspense>
      <ViewAuditsContent />
    </Suspense>
  );
}
