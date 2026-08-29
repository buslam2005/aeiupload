// Typed fetch wrappers over the Phase 3/5 backend, mirroring
// backend/app/routers/{lookups,uploads}.py exactly. Relative "/api/..." paths
// work because FastAPI serves both the API and this static export from the
// same origin/port (see developmentplan_execution.md - single-port
// architecture) - no base URL configuration needed.

import type {
  AuditRecordEntry,
  BatchDetail,
  BatchSummary,
  CourseChoice,
  Institute,
  ProgrammeChoice,
  ProgrammeTitleChoice,
  SignatoryDetail,
  SignatoryListItem,
  UploadStudent,
} from "./types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  if (!response.ok) {
    // FastAPI's HTTPException responses are {"detail": "<user-facing message>"} -
    // surface that verbatim (e.g. the file-upload error messages from
    // requirements.md's "Error handling at file upload") rather than a generic
    // "failed: <status>", which callers can't show to the user as-is.
    let detail: string | undefined;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // no JSON body (or none matching this shape) - fall through below
    }
    throw new Error(detail ?? `${init?.method ?? "GET"} ${path} failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function getInstitutes(): Promise<Institute[]> {
  return apiFetch("/institutes");
}

export function getProgrammes(instituteCode: string): Promise<ProgrammeChoice[]> {
  return apiFetch(`/programmes?institute_code=${encodeURIComponent(instituteCode)}`);
}

export function getProgrammeTitles(instituteCode: string): Promise<ProgrammeTitleChoice[]> {
  return apiFetch(`/programme-titles?institute_code=${encodeURIComponent(instituteCode)}`);
}

export function getBatches(instituteCode?: string): Promise<BatchSummary[]> {
  return apiFetch(instituteCode ? `/batches?institute_code=${encodeURIComponent(instituteCode)}` : "/batches");
}

export function getBatch(batchId: number): Promise<BatchDetail> {
  return apiFetch(`/batches/${batchId}`);
}

export function getUploadStudent(id: number): Promise<UploadStudent> {
  return apiFetch(`/upload-students/${id}`);
}

export function uploadAlternatePath(params: {
  instituteCode: string;
  nmc_trainingtype: string;
  nmc_programme: string;
  nmc_academicroute: string;
  file: File;
}): Promise<BatchDetail> {
  const body = new FormData();
  body.set("institute_code", params.instituteCode);
  body.set("nmc_trainingtype", params.nmc_trainingtype);
  body.set("nmc_programme", params.nmc_programme);
  body.set("nmc_academicroute", params.nmc_academicroute);
  body.set("file", params.file);
  return apiFetch("/uploads/alternate-path", { method: "POST", body });
}

export function uploadOriginalPath(params: {
  instituteCode: string;
  nmc_trainingtype?: string;
  nmc_programme?: string;
  nmc_academicroute?: string;
  file: File;
}): Promise<BatchDetail> {
  const body = new FormData();
  body.set("institute_code", params.instituteCode);
  if (params.nmc_trainingtype) body.set("nmc_trainingtype", params.nmc_trainingtype);
  if (params.nmc_programme) body.set("nmc_programme", params.nmc_programme);
  if (params.nmc_academicroute) body.set("nmc_academicroute", params.nmc_academicroute);
  body.set("file", params.file);
  return apiFetch("/uploads/original-path", { method: "POST", body });
}

export function resubmitWithProgramme(params: {
  uploadStudentIds: number[];
  nmc_trainingtype: string;
  nmc_programme: string;
  nmc_academicroute: string;
}): Promise<UploadStudent[]> {
  return apiFetch(
    "/upload-students/resubmit-with-programme",
    jsonInit("POST", {
      upload_student_ids: params.uploadStudentIds,
      nmc_trainingtype: params.nmc_trainingtype,
      nmc_programme: params.nmc_programme,
      nmc_academicroute: params.nmc_academicroute,
    })
  );
}

// The exact field set app/schemas.py's ResubmitFullRequest expects - derived
// from UploadStudent by excluding the server-managed/derived fields (id,
// batch link, line number, upload time, status, error slots, resolved
// programme name, resolved institute name), so it can never drift out of
// sync with UploadStudent.
export type ResubmitFullPayload = Omit<
  UploadStudent,
  | "id"
  | "upload_batch_id"
  | "nmc_linenumber"
  | "nmc_rowuploadtime"
  | "nmc_rowstatus"
  | "nmc_error1description"
  | "nmc_error2description"
  | "nmc_error3description"
  | "nmc_error4description"
  | "nmc_error5description"
  | "nmc_programmename"
  | "institute_name"
>;

export function resubmitFull(id: number, payload: ResubmitFullPayload): Promise<UploadStudent> {
  return apiFetch(`/upload-students/${id}/resubmit-full`, jsonInit("POST", payload));
}

/** Picks exactly the ResubmitFullPayload fields off a full UploadStudent row -
 * the View Details form's editable state - so the request body never carries
 * server-managed fields (id, status, error slots, etc.) that ResubmitFullRequest
 * doesn't accept. */
export function toResubmitFullPayload(row: UploadStudent): ResubmitFullPayload {
  return {
    nmc_nmcpin: row.nmc_nmcpin,
    nmc_nmctitlename: row.nmc_nmctitlename,
    nmc_firstname: row.nmc_firstname,
    nmc_maidenname: row.nmc_maidenname,
    nmc_lastname: row.nmc_lastname,
    nmc_dateofbirth: row.nmc_dateofbirth,
    nmc_gender: row.nmc_gender,
    nmc_nationalityname: row.nmc_nationalityname,
    nmc_countryofbirthname: row.nmc_countryofbirthname,
    nmc_email: row.nmc_email,
    nmc_addressline1: row.nmc_addressline1,
    nmc_addressline2: row.nmc_addressline2,
    nmc_addressline3: row.nmc_addressline3,
    nmc_city: row.nmc_city,
    nmc_postcode: row.nmc_postcode,
    nmc_countryname: row.nmc_countryname,
    nmc_traininginstitutecode: row.nmc_traininginstitutecode,
    nmc_trainingtype: row.nmc_trainingtype,
    nmc_programme: row.nmc_programme,
    nmc_academicroute: row.nmc_academicroute,
    nmc_coursestartdate: row.nmc_coursestartdate,
    nmc_courseenddate: row.nmc_courseenddate,
    nmc_trainingexampassdate: row.nmc_trainingexampassdate,
    nmc_trainingstartdate: row.nmc_trainingstartdate,
    nmc_trainingcompletiondate: row.nmc_trainingcompletiondate,
  };
}

export function deleteUploadStudent(id: number): Promise<void> {
  return apiFetch(`/upload-students/${id}`, { method: "DELETE" });
}

// --- Authorized Signatory (mirrors backend/app/routers/{lookups,signatories}.py) ---

export function getSignatories(active: "Yes" | "No"): Promise<SignatoryListItem[]> {
  return apiFetch(`/signatories?active=${encodeURIComponent(active)}`);
}

export function getSignatory(pin: string): Promise<SignatoryDetail> {
  return apiFetch(`/signatories/${encodeURIComponent(pin)}`);
}

export function getSignatoryAudit(pin: string): Promise<AuditRecordEntry[]> {
  return apiFetch(`/signatories/${encodeURIComponent(pin)}/audit`);
}

export function getCourseChoices(instituteCode: string): Promise<CourseChoice[]> {
  return apiFetch(`/course-choices?institute_code=${encodeURIComponent(instituteCode)}`);
}

export function addCourse(
  pin: string,
  choice: Pick<CourseChoice, "nmc_trainingtype" | "nmc_programme" | "nmc_academicroute" | "nmc_qualificationlevel">
): Promise<SignatoryDetail> {
  return apiFetch(`/signatories/${encodeURIComponent(pin)}/courses`, jsonInit("POST", choice));
}

export function removeCourse(pin: string, slot: number): Promise<SignatoryDetail> {
  return apiFetch(`/signatories/${encodeURIComponent(pin)}/courses/${slot}`, { method: "DELETE" });
}

export function matchSignatory(pin: string, lastname: string): Promise<SignatoryDetail> {
  return apiFetch("/signatories/match", jsonInit("POST", { nmc_pin: pin, nmc_lastname: lastname }));
}
