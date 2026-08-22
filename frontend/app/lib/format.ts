import type { ProgrammeChoice, UploadStudent } from "./types";

export function instituteLabel(institute: { name: string; code: string }): string {
  return `${institute.name} - ${institute.code}`;
}

/** Upload Summary's "You are logged in as" / institute context comes from
 * institute_code + institute_name query params. After an action (resubmit,
 * bulk resubmit) navigates back there, this rebuilds that context from the
 * affected record's own institute, so it reflects the record just acted on
 * rather than resetting to "no institute selected". */
export function uploadSummaryPath(
  instituteCode: string | null | undefined,
  instituteName: string | null | undefined
): string {
  if (!instituteCode || !instituteName) return "/upload-summary";
  const params = new URLSearchParams({ institute_code: instituteCode, institute_name: instituteName });
  return `/upload-summary?${params.toString()}`;
}

/** First-occurrence-wins de-duplication by a derived key, preserving order. */
export function distinctBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function programmeLabel(
  choice: Pick<
    ProgrammeChoice,
    "nmc_trainingtype" | "nmc_programme" | "nmc_academicroute" | "nmc_programmename"
  >
): string {
  return `${choice.nmc_trainingtype}-${choice.nmc_programme}-${choice.nmc_academicroute}-${choice.nmc_programmename}`;
}

/** Same 4-field concatenation as programmeLabel, but tolerant of the nulls an
 * UploadStudent row can have (unresolved programme name, missing fields on a
 * badly-formed upload row). Returns null if there isn't enough to show. */
export function rowProgrammeLabel(row: UploadStudent): string | null {
  const { nmc_trainingtype, nmc_programme, nmc_academicroute, nmc_programmename } = row;
  if (!nmc_trainingtype || !nmc_programme || !nmc_academicroute || !nmc_programmename) {
    return null;
  }
  return programmeLabel({
    nmc_trainingtype,
    nmc_programme,
    nmc_academicroute,
    nmc_programmename,
  });
}

/** "Name (concatenate nmcpin, hyphen, first name, last name)" - UI_requirements.md */
export function nameLabel(row: Pick<UploadStudent, "nmc_nmcpin" | "nmc_firstname" | "nmc_lastname">): string {
  return [row.nmc_nmcpin, row.nmc_firstname, row.nmc_lastname].map((v) => v ?? "").join("-");
}

/** nmc_dateofbirth (YYYYMMDD) -> YYYY-MM-DD, per the View Details field mapping. */
export function toIsoDate(yyyymmdd: string | null): string {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return yyyymmdd ?? "";
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/** An ISO timestamp -> "DD/MM/YYYY hh:mm AM/PM" in British time (BST/GMT as
 * applicable), per the "Requested On" / "Created On" column spec. */
export function toBritishDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toUpperCase()
    .replace(/^0(\d:)/, "$1");

  return `${datePart} ${timePart}`;
}

const ERROR_FIELDS = [
  "nmc_error1description",
  "nmc_error2description",
  "nmc_error3description",
  "nmc_error4description",
  "nmc_error5description",
] as const;

/** Finds the error message (if any) for a given View Details field label,
 * by matching the "<Field> does not match with organization's record."
 * pattern the backend writes into nmc_errorNdescription (app/services/matching.py) -
 * the slot number is sequential, not fixed per field, so message content is
 * the only reliable way to place an error under its field. */
export function getFieldError(row: UploadStudent, fieldLabel: string): string | undefined {
  const prefix = `${fieldLabel} does not match`;
  for (const field of ERROR_FIELDS) {
    const message = row[field];
    if (message?.startsWith(prefix)) return message;
  }
  return undefined;
}

export function allErrorMessages(row: UploadStudent): string[] {
  return ERROR_FIELDS.map((f) => row[f]).filter((v): v is string => Boolean(v));
}
