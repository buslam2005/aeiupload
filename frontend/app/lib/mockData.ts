// Phase 4 is UI-structure-only (see developmentplan_execution.md) - no backend
// calls yet, that's Phase 5. This mock data mirrors the real seeded database
// (backend/app/seed_data/) and the real Phase 3 API response shapes exactly, so
// swapping mock data for fetch() calls in Phase 5 is a like-for-like change.

import type { BatchDetail, BatchSummary, Institute, ProgrammeChoice, ProgrammeTitleChoice } from "./types";

export const MOCK_INSTITUTES: Institute[] = [
  { code: "8020", name: "Canterbury Christ Church University" },
  { code: "1315", name: "University of Chester" },
];

export const MOCK_PROGRAMMES: Record<string, ProgrammeChoice[]> = {
  "1315": [
    { nmc_trainingtype: "F", nmc_programme: "P2", nmc_academicroute: "Level 7", nmc_programmename: "Community Practitioner Nurse Prescribing V150" },
    { nmc_trainingtype: "R", nmc_programme: "AN1", nmc_academicroute: "B Nurs (Hons)", nmc_programmename: "Pre-registration nursing - Adult" },
    { nmc_trainingtype: "R", nmc_programme: "SC1", nmc_academicroute: "B Nurs (Hons)", nmc_programmename: "Pre-registration nursing - Child" },
    { nmc_trainingtype: "S", nmc_programme: "DF3", nmc_academicroute: "PG Dip", nmc_programmename: "Specialist Practitioner - District Nursing with integrated Independent and Supplementary Prescribing (V300)" },
  ],
  "8020": [
    { nmc_trainingtype: "G", nmc_programme: "1", nmc_academicroute: "Level 6", nmc_programmename: "Return to Practice - Nursing" },
    { nmc_trainingtype: "G", nmc_programme: "1", nmc_academicroute: "Level 7", nmc_programmename: "Return to Practice - Nursing" },
    { nmc_trainingtype: "M", nmc_programme: "MW1", nmc_academicroute: "Level 6", nmc_programmename: "Pre-registration Midwifery" },
    { nmc_trainingtype: "R", nmc_programme: "AN1", nmc_academicroute: "BSc (Hons)", nmc_programmename: "Pre-registration nursing - Adult" },
    { nmc_trainingtype: "R", nmc_programme: "MN1", nmc_academicroute: "BSc (Hons)", nmc_programmename: "Pre-registration nursing - Mental Health" },
  ],
};

// One entry per real programmes row (undeduped by qualification level, unlike
// MOCK_PROGRAMMES) - see ProgrammeTitleChoice. Used only by Upload Programme
// Selection's HEI Programme drop-down.
export const MOCK_PROGRAMME_TITLES: Record<string, ProgrammeTitleChoice[]> = {
  "1315": [
    { nmc_trainingtype: "R", nmc_programme: "SC1", nmc_academicroute: "B Nurs (Hons)", nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing Apprenticeship" },
    { nmc_trainingtype: "R", nmc_programme: "SC1", nmc_academicroute: "B Nurs (Hons)", nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing" },
    { nmc_trainingtype: "R", nmc_programme: "AN1", nmc_academicroute: "B Nurs (Hons)", nmc_aeiprogrammetitle: "BN (Hons) Adult Nursing" },
    { nmc_trainingtype: "R", nmc_programme: "AN1", nmc_academicroute: "B Nurs (Hons)", nmc_aeiprogrammetitle: "BN (Hons) Adult Nursing Apprenticeship" },
    { nmc_trainingtype: "F", nmc_programme: "P2", nmc_academicroute: "Level 7", nmc_aeiprogrammetitle: "Community Practitioner Nurse Prescribing V150 (L7)" },
    { nmc_trainingtype: "F", nmc_programme: "P2", nmc_academicroute: "Level 7", nmc_aeiprogrammetitle: "Advancing Community Practitioner Nurse Prescribing V150 (level seven)" },
    { nmc_trainingtype: "S", nmc_programme: "DF3", nmc_academicroute: "PG Dip", nmc_aeiprogrammetitle: "Post Graduate Diploma Specialist Practice Qualification- District Nursing with integrated Independent and Supplementary Prescribing (V300)" },
    { nmc_trainingtype: "S", nmc_programme: "DF3", nmc_academicroute: "PG Dip", nmc_aeiprogrammetitle: "Specialist Practice Qualification District Nurse (Apprenticeship)" },
  ],
  "8020": [
    { nmc_trainingtype: "R", nmc_programme: "MN1", nmc_academicroute: "BSc (Hons)", nmc_aeiprogrammetitle: "BSc (Hons) Nursing (Mental Health)" },
    { nmc_trainingtype: "R", nmc_programme: "AN1", nmc_academicroute: "BSc (Hons)", nmc_aeiprogrammetitle: "BSc (Hons) Nursing (Adult)" },
    { nmc_trainingtype: "M", nmc_programme: "MW1", nmc_academicroute: "Level 6", nmc_aeiprogrammetitle: "BSc (Hons) Midwifery (Apprenticeship)" },
    { nmc_trainingtype: "M", nmc_programme: "MW1", nmc_academicroute: "Level 6", nmc_aeiprogrammetitle: "BSc (Hons) Midwifery" },
    { nmc_trainingtype: "G", nmc_programme: "1", nmc_academicroute: "Level 6", nmc_aeiprogrammetitle: "Return to Practice (Mental Health Nursing)" },
    { nmc_trainingtype: "G", nmc_programme: "1", nmc_academicroute: "Level 7", nmc_aeiprogrammetitle: "Return to Practice (Child Nursing)" },
  ],
};

const BATCH_1: BatchDetail = {
  nmc_uploadbatchid: 1,
  nmc_uploadbatchtime: "2026-08-20T09:25:00+00:00",
  nmc_uploadby: "User1",
  nmc_institutecode: "1315",
  institute_name: "University of Chester",
  nmc_programme: "SC1",
  nmc_academicroute: "B Nurs (Hons)",
  nmc_filename: "sc1-students.csv",
  nmc_totalrecords: 1,
  nmc_totalsuccessrecords: 1,
  nmc_totalfailedrecords: 0,
  status: "Processing Complete",
  uploaded_records: [
    {
      id: 101,
      upload_batch_id: 1,
      nmc_linenumber: 2,
      nmc_nmcpin: "16H0404E",
      nmc_nmctitlename: "Miss",
      nmc_firstname: "ROSE 1",
      nmc_maidenname: null,
      nmc_lastname: "LEE",
      nmc_dateofbirth: "20020524",
      nmc_gender: "F",
      nmc_nationalityname: "Nigerian",
      nmc_countryofbirthname: "Nigeria",
      nmc_email: "2211471@uknmc.org",
      nmc_addressline1: "London Road 1",
      nmc_addressline2: "BOLTON",
      nmc_addressline3: null,
      nmc_city: "Woodford",
      nmc_postcode: "CM168AH",
      nmc_countryname: "England",
      nmc_traininginstitutecode: "1315",
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
      nmc_coursestartdate: "20200901",
      nmc_courseenddate: "20290901",
      nmc_trainingexampassdate: "20260812",
      nmc_trainingstartdate: "20220919",
      nmc_trainingcompletiondate: "20260812",
      nmc_rowuploadtime: "2026-08-20T09:25:01+00:00",
      nmc_rowstatus: "Success",
      nmc_error1description: null,
      nmc_error2description: null,
      nmc_error3description: null,
      nmc_error4description: null,
      nmc_error5description: null,
      nmc_programmename: "Pre-registration nursing - Child",
    },
  ],
  error_records: [],
};

const BATCH_2: BatchDetail = {
  nmc_uploadbatchid: 2,
  nmc_uploadbatchtime: "2026-08-21T14:03:00+00:00",
  nmc_uploadby: "User1",
  nmc_institutecode: "1315",
  institute_name: "University of Chester",
  nmc_programme: null,
  nmc_academicroute: null,
  nmc_filename: "mixed-students.csv",
  nmc_totalrecords: 2,
  nmc_totalsuccessrecords: 1,
  nmc_totalfailedrecords: 1,
  status: "Failed",
  uploaded_records: [
    {
      id: 201,
      upload_batch_id: 2,
      nmc_linenumber: 2,
      nmc_nmcpin: "16H0405E",
      nmc_nmctitlename: "Miss",
      nmc_firstname: "ROSE 2",
      nmc_maidenname: null,
      nmc_lastname: "LEE",
      nmc_dateofbirth: "20040321",
      nmc_gender: "F",
      nmc_nationalityname: "British",
      nmc_countryofbirthname: "England",
      nmc_email: "2211471@uknmc.org",
      nmc_addressline1: "London Road 2",
      nmc_addressline2: "TARPORLEY",
      nmc_addressline3: "CHESHIRE",
      nmc_city: "Woodford",
      nmc_postcode: "CM160BS",
      nmc_countryname: "England",
      nmc_traininginstitutecode: "1315",
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
      nmc_coursestartdate: "20200901",
      nmc_courseenddate: "20290901",
      nmc_trainingexampassdate: "20260812",
      nmc_trainingstartdate: "20230918",
      nmc_trainingcompletiondate: "20260812",
      nmc_rowuploadtime: "2026-08-21T14:03:01+00:00",
      nmc_rowstatus: "Success",
      nmc_error1description: null,
      nmc_error2description: null,
      nmc_error3description: null,
      nmc_error4description: null,
      nmc_error5description: null,
      nmc_programmename: "Pre-registration nursing - Child",
    },
  ],
  error_records: [
    {
      id: 202,
      upload_batch_id: 2,
      nmc_linenumber: 3,
      nmc_nmcpin: "16H0404E",
      nmc_nmctitlename: "Miss",
      nmc_firstname: "WRONG NAME",
      nmc_maidenname: null,
      nmc_lastname: "LEE",
      nmc_dateofbirth: "20020524",
      nmc_gender: "F",
      nmc_nationalityname: "Nigerian",
      nmc_countryofbirthname: "Nigeria",
      nmc_email: "2211471@uknmc.org",
      nmc_addressline1: "London Road 1",
      nmc_addressline2: "BOLTON",
      nmc_addressline3: null,
      nmc_city: "Woodford",
      nmc_postcode: "CM168AH",
      nmc_countryname: "England",
      nmc_traininginstitutecode: "1315",
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
      nmc_coursestartdate: "20200901",
      nmc_courseenddate: "20290901",
      nmc_trainingexampassdate: "20260812",
      nmc_trainingstartdate: "20220919",
      nmc_trainingcompletiondate: "20260812",
      nmc_rowuploadtime: "2026-08-21T14:03:01+00:00",
      nmc_rowstatus: "Failed",
      nmc_error1description: "First name does not match with organization's record.",
      nmc_error2description: null,
      nmc_error3description: null,
      nmc_error4description: null,
      nmc_error5description: null,
      nmc_programmename: "Pre-registration nursing - Child",
    },
  ],
};

export const MOCK_BATCH_DETAILS: Record<number, BatchDetail> = {
  1: BATCH_1,
  2: BATCH_2,
};

function toBatchSummary(detail: BatchDetail): BatchSummary {
  const { nmc_uploadbatchid, nmc_uploadbatchtime, nmc_uploadby, nmc_institutecode, institute_name, nmc_programme, nmc_academicroute, nmc_filename, nmc_totalrecords, nmc_totalsuccessrecords, nmc_totalfailedrecords, status } = detail;
  return { nmc_uploadbatchid, nmc_uploadbatchtime, nmc_uploadby, nmc_institutecode, institute_name, nmc_programme, nmc_academicroute, nmc_filename, nmc_totalrecords, nmc_totalsuccessrecords, nmc_totalfailedrecords, status };
}

export const MOCK_BATCH_SUMMARIES: BatchSummary[] = [BATCH_2, BATCH_1].map(toBatchSummary);

export function findMockUploadStudent(id: number) {
  for (const batch of Object.values(MOCK_BATCH_DETAILS)) {
    const row = [...batch.uploaded_records, ...batch.error_records].find((r) => r.id === id);
    if (row) return { row, batch };
  }
  return undefined;
}
