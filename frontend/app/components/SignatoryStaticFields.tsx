import type { SignatoryDetail } from "../lib/types";
import TagList from "./TagList";

// Static field block shared by View Details and Add Signatory step 2 - same
// layout in both (AuthorisedSignatoriesFirstPage_ViewDetails.png /
// AuthorisedSignatories_AddNewSignatories_AddCourse.png). All fields are
// read-only per UI_requirements.md ("all static and not editable for demo
// purpose"), so these render as plain boxes, not <input>s.
function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-5">
      <p className="mb-1 font-medium">{label}</p>
      <div className="w-full max-w-md rounded border border-brand-border bg-brand-disabled-bg px-3 py-2 text-brand-disabled-text">
        {value}
      </div>
    </div>
  );
}

export default function SignatoryStaticFields({ detail }: { detail: SignatoryDetail }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <StaticField label="NMC PIN" value={detail.nmc_pin} />
        <StaticField label="Surname" value={detail.nmc_lastname} />
      </div>
      <StaticField label="Full Name" value={detail.nmc_firstname} />
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <StaticField label="Registration Expiry Date" value={detail.nmc_regexpirydate} />
        <StaticField label="Added By" value={detail.nmc_addedby} />
      </div>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <StaticField label="AEI" value={detail.nmc_institutename} />
        <StaticField label="Created On" value={detail.nmc_createdon} />
      </div>
      <div className="mb-5">
        <p className="mb-1 font-medium">Register Part</p>
        <TagList values={detail.register_parts} />
      </div>
      <div className="mb-5">
        <p className="mb-1 font-medium">Practice Type</p>
        <TagList values={detail.practice_types} />
      </div>
    </div>
  );
}
