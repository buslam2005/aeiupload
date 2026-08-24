"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../components/PageShell";
import { primaryButtonClass } from "../components/buttonStyles";
import { instituteLabel } from "../lib/format";
import { getInstitutes } from "../lib/api";
import type { Institute } from "../lib/types";

export default function SelectInstitutePage() {
  const router = useRouter();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedCode, setSelectedCode] = useState("");

  useEffect(() => {
    getInstitutes().then((data) =>
      setInstitutes([...data].sort((a, b) => a.name.localeCompare(b.name)))
    );
  }, []);

  function handleContinue() {
    const institute = institutes.find((i) => i.code === selectedCode);
    if (!institute) return;
    const params = new URLSearchParams({
      institute_code: institute.code,
      institute_name: institute.name,
    });
    router.push(`/upload-summary?${params.toString()}`);
  }

  return (
    <PageShell>
      <label htmlFor="institute" className="mb-2 block font-medium">
        Please select a higher education institute to log in as:
      </label>
      <select
        id="institute"
        className="mb-6 w-full max-w-xl rounded border border-brand-border px-3 py-2"
        value={selectedCode}
        onChange={(e) => setSelectedCode(e.target.value)}
      >
        <option value="" disabled>
          Select
        </option>
        {institutes.map((institute) => (
          <option key={institute.code} value={institute.code}>
            {instituteLabel(institute)}
          </option>
        ))}
      </select>

      <div>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={!selectedCode}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </PageShell>
  );
}
