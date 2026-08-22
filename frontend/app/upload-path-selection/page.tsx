"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import GuidanceBox from "../components/GuidanceBox";
import { primaryButtonClass } from "../components/buttonStyles";

type Path = "alternate" | "original";

function UploadPathSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const [selected, setSelected] = useState<Path | null>(null);

  function handleNext() {
    if (!selected) return;
    const destination = selected === "alternate" ? "upload-programme-selection" : "upload-original-path";
    router.push(`/${destination}?${qs}`);
  }

  return (
    <PageShell>
      <GuidanceBox>
        <p className="mb-3">
          If the file contains students of a single course, you may choose to upload by
          &apos;Same course for all students&apos;.
        </p>
        <p className="mb-3">
          However if the file contains students of multiple course, you have to choose
          &apos;Multiple course - Multiple students&apos;. In there you can check the course code
          and corresponding academic level here.
        </p>
        <p>Click Next to proceed with your upload.</p>
      </GuidanceBox>

      <div className="my-6 flex gap-4">
        <button
          type="button"
          onClick={() => setSelected("alternate")}
          className={`flex h-32 w-40 flex-col items-start justify-center rounded p-3 text-left font-semibold text-white transition-colors ${
            selected === "alternate" ? "bg-brand-accent-hover ring-2 ring-brand-header" : "bg-brand-accent"
          }`}
        >
          Same course for all Students
        </button>
        <button
          type="button"
          onClick={() => setSelected("original")}
          className={`flex h-32 w-40 flex-col items-start justify-center rounded p-3 text-left font-semibold text-white transition-colors ${
            selected === "original" ? "bg-brand-accent-hover ring-2 ring-brand-header" : "bg-brand-accent"
          }`}
        >
          Multiple courses - Multiple students
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => router.push(`/upload-summary?${qs}`)}
        >
          Back
        </button>
        <button type="button" className={primaryButtonClass} disabled={!selected} onClick={handleNext}>
          Next
        </button>
      </div>
    </PageShell>
  );
}

export default function UploadPathSelectionPage() {
  return (
    <Suspense>
      <UploadPathSelectionContent />
    </Suspense>
  );
}
