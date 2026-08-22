"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import GuidanceBox from "../components/GuidanceBox";
import FilePickerIcon from "../components/FilePickerIcon";
import { primaryButtonClass } from "../components/buttonStyles";
import { getProgrammeTitles, uploadAlternatePath } from "../lib/api";
import type { ProgrammeTitleChoice } from "../lib/types";

function UploadProgrammeSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const instituteCode = searchParams.get("institute_code") ?? "";

  const [choices, setChoices] = useState<ProgrammeTitleChoice[]>([]);
  const [selectedIndex, setSelectedIndex] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Backed by GET /api/programme-titles, which - unlike GET /api/programmes -
  // does NOT collapse qualification-level variants: the same programme's
  // Apprenticeship vs Full Time routes have different titles, and this
  // drop-down must show both.
  useEffect(() => {
    if (!instituteCode) return;
    getProgrammeTitles(instituteCode).then(setChoices);
  }, [instituteCode]);

  const programmeSelected = selectedIndex !== "";

  async function handleUpload() {
    if (!programmeSelected || !file) return;
    const choice = choices[Number(selectedIndex)];
    setUploading(true);
    try {
      const batch = await uploadAlternatePath({
        instituteCode,
        nmc_trainingtype: choice.nmc_trainingtype,
        nmc_programme: choice.nmc_programme,
        nmc_academicroute: choice.nmc_academicroute,
        file,
      });
      router.push(`/upload-result?batchId=${batch.nmc_uploadbatchid}`);
    } finally {
      setUploading(false);
    }
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
          disabled={!programmeSelected || !file || uploading}
          onClick={handleUpload}
        >
          {uploading ? "Uploading..." : "Upload"}
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
