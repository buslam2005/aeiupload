"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import GuidanceBox from "../components/GuidanceBox";
import FilePickerIcon from "../components/FilePickerIcon";
import { primaryButtonClass } from "../components/buttonStyles";
import { distinctBy } from "../lib/format";
import { MOCK_PROGRAMME_TITLES } from "../lib/mockData";

function UploadProgrammeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const instituteCode = searchParams.get("institute_code") ?? "";

  const [selectedIndex, setSelectedIndex] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Distinct by nmc_aeiprogrammetitle, per the requested change - unlike the
  // Revised Programme drop-down, this list is allowed (and expected) to show
  // separate entries for the same programme's qualification-level variants,
  // since their titles differ.
  const choices = useMemo(
    () => distinctBy(MOCK_PROGRAMME_TITLES[instituteCode] ?? [], (c) => c.nmc_aeiprogrammetitle),
    [instituteCode]
  );

  const programmeSelected = selectedIndex !== "";

  function handleUpload() {
    if (!programmeSelected || !file) return;
    // Phase 5 will POST to /api/uploads/alternate-path here and route to the
    // real returned batch id - Phase 4 has no backend wiring yet.
    router.push(`/upload-result?batchId=1`);
  }

  return (
    <PageShell>
      <GuidanceBox>
        <p className="mb-3">
          If the file contains students who attained multiple courses, please click
          &apos;Back&apos; and upload with &apos;Multiple course - Multiple students&apos; option.
        </p>
        <p>
          Select the HEI programme from the drop-down box which is the course attained by the
          students in the upload template. Click Upload to proceed with the upload.
        </p>
      </GuidanceBox>

      <div className="my-6">
        <label htmlFor="programme" className="mb-2 block font-medium">
          HEI Programme
        </label>
        <select
          id="programme"
          className="w-full max-w-xl rounded border border-brand-border px-3 py-2"
          value={selectedIndex}
          onChange={(e) => {
            setSelectedIndex(e.target.value);
            setFile(null);
          }}
        >
          <option value="" disabled>
            Select a programme
          </option>
          {choices.map((choice, index) => (
            <option key={choice.nmc_aeiprogrammetitle} value={index}>
              {choice.nmc_aeiprogrammetitle}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <span className="mb-2 block font-medium">Select a student qualifications file to upload</span>
        <FilePickerIcon id="file" disabled={!programmeSelected} file={file} onChange={setFile} />
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
          disabled={!programmeSelected || !file}
          onClick={handleUpload}
        >
          Upload
        </button>
      </div>
    </PageShell>
  );
}

export default function UploadProgrammeSelectionPage() {
  return (
    <Suspense>
      <UploadProgrammeSelectionContent />
    </Suspense>
  );
}
