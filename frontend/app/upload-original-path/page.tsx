"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import GuidanceBox from "../components/GuidanceBox";
import FilePickerIcon from "../components/FilePickerIcon";
import { primaryButtonClass } from "../components/buttonStyles";
import { MOCK_INSTITUTES, MOCK_PROGRAMMES } from "../lib/mockData";

function UploadOriginalPathContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  const [instituteCode, setInstituteCode] = useState(searchParams.get("institute_code") ?? "");
  const [programme, setProgramme] = useState("");
  const [academicRoute, setAcademicRoute] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const choices = useMemo(() => MOCK_PROGRAMMES[instituteCode] ?? [], [instituteCode]);
  const distinctRoutes = useMemo(
    () => Array.from(new Set(choices.map((c) => c.nmc_academicroute))),
    [choices]
  );

  function handleUpload() {
    if (!instituteCode || !programme || !file) return;
    // Phase 5 will POST to /api/uploads/original-path here and route to the
    // real returned batch id - Phase 4 has no backend wiring yet.
    router.push(`/upload-result?batchId=2`);
  }

  return (
    <PageShell>
      <GuidanceBox>
        <p className="mb-3">
          You can check the course code and corresponding academic level here. If you believe
          there is a course missing or the academic level is not correct, please contact us.
        </p>
        <p>If you do not need to check course information, you can proceed straight to upload.</p>
      </GuidanceBox>

      <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="institute-code" className="mb-2 block font-medium">
            Institute Code *
          </label>
          <select
            id="institute-code"
            className="w-full rounded border border-brand-border px-3 py-2"
            value={instituteCode}
            onChange={(e) => {
              setInstituteCode(e.target.value);
              setProgramme("");
              setAcademicRoute("");
              setFile(null);
            }}
          >
            <option value="" disabled>
              Select
            </option>
            {MOCK_INSTITUTES.map((institute) => (
              <option key={institute.code} value={institute.code}>
                {institute.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="programme" className="mb-2 block font-medium">
            Programme
          </label>
          <select
            id="programme"
            className="w-full rounded border border-brand-border px-3 py-2"
            value={programme}
            disabled={!instituteCode}
            onChange={(e) => {
              setProgramme(e.target.value);
              setFile(null);
            }}
          >
            <option value="">Select a programme</option>
            {choices.map((choice) => (
              <option key={choice.nmc_programme} value={choice.nmc_programme}>
                {choice.nmc_programme} - {choice.nmc_programmename}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="academic-route" className="mb-2 block font-medium">
            Academic Route
          </label>
          <select
            id="academic-route"
            className="w-full rounded border border-brand-border px-3 py-2"
            value={academicRoute}
            disabled={!instituteCode}
            onChange={(e) => setAcademicRoute(e.target.value)}
          >
            <option value="">Select academic route</option>
            {distinctRoutes.map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <span className="mb-2 block font-medium">Select a student qualifications file to upload</span>
        <FilePickerIcon id="file" disabled={!programme} file={file} onChange={setFile} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => router.push(`/upload-path-selection?${qs}`)}
        >
          Back
        </button>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={!instituteCode || !programme || !file}
          onClick={handleUpload}
        >
          Upload
        </button>
      </div>
    </PageShell>
  );
}

export default function UploadOriginalPathPage() {
  return (
    <Suspense>
      <UploadOriginalPathContent />
    </Suspense>
  );
}
