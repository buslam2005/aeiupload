"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../../components/PageShell";
import { primaryButtonClass } from "../../components/buttonStyles";
import { matchSignatory } from "../mockData";

// AuthorisedSignatories_AddNewSignatories1.png's exact wording for the
// mismatch message - requirements.md doesn't specify one, so this diagram is
// the only concrete source of text.
const MISMATCH_MESSAGE = "Please enter the registrant's PIN and Surname to retrieve their details";

export default function AddSignatoryPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [surname, setSurname] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const match = matchSignatory(pin, surname);
    if (!match) {
      setError(MISMATCH_MESSAGE);
      return;
    }
    setError(null);
    router.push(`/authorised-signatories/add-signatory/detail?pin=${encodeURIComponent(match.nmc_pin)}`);
  }

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap gap-8">
        <div>
          <label htmlFor="add-signatory-pin" className="mb-1 block font-medium">
            NMC PIN
          </label>
          <input
            id="add-signatory-pin"
            type="text"
            className="w-64 rounded border border-brand-border px-3 py-2"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="add-signatory-surname" className="mb-1 block font-medium">
            Surname
          </label>
          <input
            id="add-signatory-surname"
            type="text"
            className="w-64 rounded border border-brand-border px-3 py-2"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="mb-6 text-sm text-brand-error">{error}</p>}

      <div className="flex gap-3">
        <button type="button" className={primaryButtonClass} onClick={handleSubmit}>
          Submit
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded border border-brand-border px-5 py-2 font-semibold hover:bg-brand-disabled-bg"
          onClick={() => router.push("/authorised-signatories")}
        >
          Return to Summary page
        </button>
      </div>
    </PageShell>
  );
}
