"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import ViewDetailsField from "../components/ViewDetailsField";
import { primaryButtonClass } from "../components/buttonStyles";
import { getFieldError, toIsoDate, uploadSummaryPath } from "../lib/format";
import { getUploadStudent, resubmitFull, toResubmitFullPayload } from "../lib/api";
import type { UploadStudent } from "../lib/types";

const TABS = ["1. Student Details", "2. Student Address", "3. Programme Information", "4. Previous Institute"] as const;

const GENDER_LABELS: Record<string, string> = { M: "Male", F: "Female" };
const GENDER_CODES: Record<string, string> = { Male: "M", Female: "F" };

function ViewDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = Number(searchParams.get("studentId"));

  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [form, setForm] = useState<UploadStudent | null | undefined>(undefined);
  const [resubmitting, setResubmitting] = useState(false);
  // Middle Name has no backing field (UI_requirements.md: "Middle Name - blank") -
  // kept as local-only state so the field is still a genuine editable input.
  const [middleName, setMiddleName] = useState("");

  useEffect(() => {
    getUploadStudent(studentId)
      .then(setForm)
      .catch(() => setForm(null));
  }, [studentId]);

  if (form === undefined) {
    return (
      <PageShell>
        <p>Loading...</p>
      </PageShell>
    );
  }

  if (!form) {
    return (
      <PageShell>
        <p>Record not found.</p>
      </PageShell>
    );
  }

  function set<K extends keyof UploadStudent>(field: K, value: UploadStudent[K]) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleResubmit() {
    if (!form) return;
    setResubmitting(true);
    try {
      await resubmitFull(studentId, toResubmitFullPayload(form));
      router.push(uploadSummaryPath(form.nmc_traininginstitutecode, form.institute_name));
    } finally {
      setResubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="mb-6 flex border-b border-brand-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-brand-header text-brand-header"
                : "text-brand-tab-inactive hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-[560px]">
        {tab === TABS[0] && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Student Details</h2>
            <ViewDetailsField
              label="NMC PIN"
              required
              value={form.nmc_nmcpin ?? ""}
              onChange={(v) => set("nmc_nmcpin", v)}
              error={getFieldError(form, "NMC PIN")}
            />
            <ViewDetailsField
              label="Title"
              required
              value={form.nmc_nmctitlename ?? ""}
              onChange={(v) => set("nmc_nmctitlename", v)}
              error={getFieldError(form, "Title")}
            />
            <ViewDetailsField
              label="First Name"
              required
              value={form.nmc_firstname ?? ""}
              onChange={(v) => set("nmc_firstname", v)}
              error={getFieldError(form, "First name")}
            />
            <ViewDetailsField
              label="Last Name"
              value={form.nmc_lastname ?? ""}
              onChange={(v) => set("nmc_lastname", v)}
              error={getFieldError(form, "Last name")}
            />
            <ViewDetailsField label="Middle Name" value={middleName} onChange={setMiddleName} />
            <ViewDetailsField
              label="Maiden Name"
              value={form.nmc_maidenname ?? ""}
              onChange={(v) => set("nmc_maidenname", v)}
              error={getFieldError(form, "Maiden name")}
            />
            <div className="mb-5">
              <label htmlFor="field-date-of-birth" className="mb-1 block font-medium">
                Date of Birth *
              </label>
              <input
                id="field-date-of-birth"
                type="date"
                className="w-full max-w-md rounded border border-brand-border px-3 py-2"
                value={toIsoDate(form.nmc_dateofbirth)}
                onChange={(e) => set("nmc_dateofbirth", e.target.value.replaceAll("-", ""))}
              />
              {getFieldError(form, "Date of birth") && (
                <p className="mt-1 text-sm text-brand-error">{getFieldError(form, "Date of birth")}</p>
              )}
            </div>
            <div className="mb-5">
              <label htmlFor="field-gender" className="mb-1 block font-medium">
                Gender *
              </label>
              <select
                id="field-gender"
                className="w-full max-w-md rounded border border-brand-border px-3 py-2"
                value={GENDER_LABELS[form.nmc_gender ?? ""] ?? ""}
                onChange={(e) => set("nmc_gender", GENDER_CODES[e.target.value] ?? e.target.value)}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {getFieldError(form, "Gender") && (
                <p className="mt-1 text-sm text-brand-error">{getFieldError(form, "Gender")}</p>
              )}
            </div>
            <ViewDetailsField
              label="Nationality"
              required
              value={form.nmc_nationalityname ?? ""}
              onChange={(v) => set("nmc_nationalityname", v)}
              error={getFieldError(form, "Nationality")}
            />
          </div>
        )}

        {tab === TABS[1] && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Student Address</h2>
            <ViewDetailsField
              label="Address Line 1"
              value={form.nmc_addressline1 ?? ""}
              onChange={(v) => set("nmc_addressline1", v)}
              error={getFieldError(form, "Address line 1")}
            />
            <ViewDetailsField
              label="Address Line 2"
              value={form.nmc_addressline2 ?? ""}
              onChange={(v) => set("nmc_addressline2", v)}
              error={getFieldError(form, "Address line 2")}
            />
            <ViewDetailsField
              label="Address Line 3"
              value={form.nmc_addressline3 ?? ""}
              onChange={(v) => set("nmc_addressline3", v)}
              error={getFieldError(form, "Address line 3")}
            />
            <ViewDetailsField
              label="City"
              value={form.nmc_city ?? ""}
              onChange={(v) => set("nmc_city", v)}
              error={getFieldError(form, "City")}
            />
            <ViewDetailsField
              label="Postcode"
              value={form.nmc_postcode ?? ""}
              onChange={(v) => set("nmc_postcode", v)}
              error={getFieldError(form, "Postcode")}
            />
            <ViewDetailsField
              label="Country"
              value={form.nmc_countryname ?? ""}
              onChange={(v) => set("nmc_countryname", v)}
              error={getFieldError(form, "Country")}
            />
          </div>
        )}

        {tab === TABS[2] && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Programme Information</h2>
            <ViewDetailsField
              label="Institute Code"
              value={form.nmc_traininginstitutecode ?? ""}
              onChange={(v) => set("nmc_traininginstitutecode", v)}
              error={getFieldError(form, "Institute code")}
            />
            <ViewDetailsField
              label="Training type"
              value={form.nmc_trainingtype ?? ""}
              onChange={(v) => set("nmc_trainingtype", v)}
              error={getFieldError(form, "Training type")}
            />
            <ViewDetailsField
              label="NMC Programme"
              value={form.nmc_programme ?? ""}
              onChange={(v) => set("nmc_programme", v)}
              error={getFieldError(form, "NMC programme")}
            />
            <ViewDetailsField
              label="Academic route"
              value={form.nmc_academicroute ?? ""}
              onChange={(v) => set("nmc_academicroute", v)}
              error={getFieldError(form, "Academic route")}
            />
            <ViewDetailsField
              label="Course Start Date"
              value={form.nmc_coursestartdate ?? ""}
              onChange={(v) => set("nmc_coursestartdate", v)}
              error={getFieldError(form, "Course start date")}
            />
            <ViewDetailsField
              label="Course End Date"
              value={form.nmc_courseenddate ?? ""}
              onChange={(v) => set("nmc_courseenddate", v)}
              error={getFieldError(form, "Course end date")}
            />
            <ViewDetailsField
              label="Training Examination Pass Date"
              value={form.nmc_trainingexampassdate ?? ""}
              onChange={(v) => set("nmc_trainingexampassdate", v)}
              error={getFieldError(form, "Training examination pass date")}
            />
          </div>
        )}

        {tab === TABS[3] && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Previous Institute</h2>
            <p className="text-brand-disabled-text">No fields.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" className={primaryButtonClass} onClick={() => router.back()}>
          Back
        </button>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={resubmitting}
          onClick={handleResubmit}
        >
          {resubmitting ? "Resubmitting..." : "Resubmit"}
        </button>
      </div>
    </PageShell>
  );
}

export default function ViewDetailsPage() {
  return (
    <Suspense>
      <ViewDetailsContent />
    </Suspense>
  );
}
