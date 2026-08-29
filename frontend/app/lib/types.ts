// Mirrors backend/app/schemas.py exactly, so Phase 5 can swap mock data for
// real fetch() calls without changing any field names.

export interface Institute {
  code: string;
  name: string;
}

export interface ProgrammeChoice {
  nmc_trainingtype: string;
  nmc_programme: string;
  nmc_academicroute: string;
  nmc_programmename: string;
}

/** Upload Programme Selection's HEI Programme drop-down needs one entry per
 * distinct nmc_aeiprogrammetitle, which - unlike ProgrammeChoice - varies by
 * qualification level (e.g. the same programme's Apprenticeship vs Full Time
 * variants have different titles). Not part of the current Phase 3
 * GET /api/programmes response shape (ProgrammeChoiceOut collapses
 * qualification level away) - Phase 5 will need to extend that endpoint or
 * add a variant for this page specifically; see developmentplan_execution.md. */
export interface ProgrammeTitleChoice {
  nmc_trainingtype: string;
  nmc_programme: string;
  nmc_academicroute: string;
  nmc_qualificationlevel: string;
  nmc_aeiprogrammetitle: string;
}

export interface UploadStudent {
  id: number;
  upload_batch_id: number;
  nmc_linenumber: number;

  nmc_nmcpin: string | null;
  nmc_nmctitlename: string | null;
  nmc_firstname: string | null;
  nmc_maidenname: string | null;
  nmc_lastname: string | null;
  nmc_dateofbirth: string | null;
  nmc_gender: string | null;
  nmc_nationalityname: string | null;
  nmc_countryofbirthname: string | null;
  nmc_email: string | null;
  nmc_addressline1: string | null;
  nmc_addressline2: string | null;
  nmc_addressline3: string | null;
  nmc_city: string | null;
  nmc_postcode: string | null;
  nmc_countryname: string | null;
  nmc_traininginstitutecode: string | null;
  nmc_trainingtype: string | null;
  nmc_programme: string | null;
  nmc_academicroute: string | null;
  nmc_coursestartdate: string | null;
  nmc_courseenddate: string | null;
  nmc_trainingexampassdate: string | null;
  nmc_trainingstartdate: string | null;
  nmc_trainingcompletiondate: string | null;

  nmc_rowuploadtime: string;
  nmc_rowstatus: "Success" | "Failed";
  nmc_error1description: string | null;
  nmc_error2description: string | null;
  nmc_error3description: string | null;
  nmc_error4description: string | null;
  nmc_error5description: string | null;

  nmc_programmename: string | null;
  institute_name: string | null;
}

export interface BatchSummary {
  nmc_uploadbatchid: number;
  nmc_uploadbatchtime: string;
  nmc_uploadby: string;
  nmc_institutecode: string;
  institute_name: string | null;
  nmc_programme: string | null;
  nmc_academicroute: string | null;
  nmc_filename: string;
  nmc_totalrecords: number;
  nmc_totalsuccessrecords: number;
  nmc_totalfailedrecords: number;
  status: string;
}

export interface BatchDetail extends BatchSummary {
  uploaded_records: UploadStudent[];
  error_records: UploadStudent[];
}

// --- Authorized Signatory (mirrors backend/app/schemas.py's signatory types) ---

export interface CourseChoice {
  nmc_programmename: string;
  nmc_trainingtype: string;
  nmc_programme: string;
  nmc_academicroute: string;
  nmc_qualificationlevel: string;
  nmc_qualificationlevelname: string;
}

export interface SignatoryListItem {
  nmc_pin: string;
  nmc_lastname: string;
  nmc_firstname: string;
  approved_course_title: string;
  register_parts: string[];
  practice_types: string[];
  nmc_regexpirydate: string;
  nmc_createdon: string;
  nmc_addedby: string;
  nmc_active: "Yes" | "No";
}

export interface CourseRow {
  slot: number;
  nmc_trainingtypecode: string;
  nmc_programmecode: string;
  nmc_academiclevel: string;
  nmc_qualificationroute: string;
  nmc_institutename: string;
  nmc_aeiprogrammetitle: string | null;
}

export interface SignatoryDetail {
  nmc_pin: string;
  nmc_lastname: string;
  nmc_firstname: string;
  nmc_regexpirydate: string;
  nmc_addedby: string;
  nmc_createdon: string;
  nmc_institutecode: string;
  nmc_institutename: string;
  nmc_active: "Yes" | "No";
  register_parts: string[];
  practice_types: string[];
  courses: CourseRow[];
}

export interface AuditRecordEntry {
  id: number;
  nmc_pin: string;
  nmc_lastname: string;
  nmc_firstname: string;
  nmc_modifiedon: string;
  nmc_attributechanged: string;
  nmc_previousvalue: string | null;
  nmc_newvalue: string | null;
  nmc_addedby: string;
}
