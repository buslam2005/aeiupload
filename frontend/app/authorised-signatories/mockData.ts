// Phase 3 (UI Development) mock fixtures, shaped exactly like the real
// Phase 2 backend responses (see backend/app/schemas.py and lib/types.ts) so
// Phase 4 can swap these for real fetch() calls without changing any field
// names - same convention as the Upload module's Phase 4 mock stage.
//
// Institute 1315 (University of Chester) course-choices catalogue below is
// copied verbatim from the real seed data (backend/app/seed_data/AEI_programmes.csv)
// so the Course Lookup pop-up already looks right once Phase 4 wires it up.
// Signatory records themselves are self-authored fixtures (not copied from
// masterapplicants.csv row-for-row), including a couple of intentionally
// unresolvable course combos (e.g. "MMW1", "FSC1") to prove the UI renders a
// sensible fallback when nmc_aeiprogrammetitle can't be resolved - the real
// backend returns null in that case (see resolve_course_title).

import type { AuditRecordEntry, CourseChoice, CourseRow, SignatoryDetail, SignatoryListItem } from "../lib/types";

export const MOCK_INSTITUTE_CODE = "1315";
export const MOCK_INSTITUTE_NAME = "University of Chester";

export const MOCK_COURSE_CHOICES: CourseChoice[] = [
  {
    nmc_programmename: "Community Practitioner Nurse Prescribing V150",
    nmc_trainingtype: "F",
    nmc_programme: "P2",
    nmc_academicroute: "Level 7",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename: "Community Practitioner Nurse Prescribing V150",
    nmc_trainingtype: "F",
    nmc_programme: "P2",
    nmc_academicroute: "Level 7",
    nmc_qualificationlevel: "P",
    nmc_qualificationlevelname: "Part Time",
  },
  {
    nmc_programmename: "Pre-registration nursing - Adult",
    nmc_trainingtype: "R",
    nmc_programme: "AN1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "A",
    nmc_qualificationlevelname: "Apprenticeship",
  },
  {
    nmc_programmename: "Pre-registration nursing - Adult",
    nmc_trainingtype: "R",
    nmc_programme: "AN1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename: "Pre-registration nursing - Child",
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "A",
    nmc_qualificationlevelname: "Apprenticeship",
  },
  {
    nmc_programmename: "Pre-registration nursing - Child",
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename:
      "Specialist Practitioner - District Nursing with integrated Independent and Supplementary Prescribing (V300)",
    nmc_trainingtype: "S",
    nmc_programme: "DF3",
    nmc_academicroute: "PG Dip",
    nmc_qualificationlevel: "A",
    nmc_qualificationlevelname: "Apprenticeship",
  },
  {
    nmc_programmename:
      "Specialist Practitioner - District Nursing with integrated Independent and Supplementary Prescribing (V300)",
    nmc_trainingtype: "S",
    nmc_programme: "DF3",
    nmc_academicroute: "PG Dip",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
];

export const MOCK_SIGNATORY_DETAILS: Record<string, SignatoryDetail> = {
  "26H0401Z": {
    nmc_pin: "26H0401Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 1",
    nmc_regexpirydate: "16/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "19/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "Yes",
    register_parts: ["Nursing", "Nursing", "Nursing"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "AN1",
        nmc_academiclevel: "B Nurs (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: "BN (Hons) Adult Nursing",
      },
    ],
  },
  "26H0402Z": {
    nmc_pin: "26H0402Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 2",
    nmc_regexpirydate: "17/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "18/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "Yes",
    register_parts: ["Midwifery", "Midwifery"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "M",
        nmc_programmecode: "MW1",
        nmc_academiclevel: "Level 6",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        // Not in institute 1315's course-choices catalogue - demonstrates the
        // unresolved-title case (real backend returns null here too).
        nmc_aeiprogrammetitle: null,
      },
    ],
  },
  "26H0499Z": {
    nmc_pin: "26H0499Z",
    nmc_lastname: "P",
    nmc_firstname: "Sai",
    nmc_regexpirydate: "31/08/2026",
    nmc_addedby: "Sai NMC AEI Admin",
    nmc_createdon: "18/06/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "Yes",
    register_parts: ["Nursing", "Midwifery", "SCPHN"],
    practice_types: ["Nursing"],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "AN",
        nmc_academiclevel: "BSc (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: null,
      },
      {
        slot: 2,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "SC1",
        nmc_academiclevel: "B Nurs (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing",
      },
    ],
  },
  "26H0405Z": {
    nmc_pin: "26H0405Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 5",
    nmc_regexpirydate: "18/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "21/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "Yes",
    register_parts: ["Nursing", "Nursing", "Nursing"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "AN1",
        nmc_academiclevel: "B Nurs (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: "BN (Hons) Adult Nursing",
      },
    ],
  },
  "26H0407Z": {
    nmc_pin: "26H0407Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 7",
    nmc_regexpirydate: "19/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "22/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "Yes",
    register_parts: ["Nursing", "Nursing"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "F",
        nmc_programmecode: "SC1",
        nmc_academiclevel: "Level 6",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: null,
      },
    ],
  },
  "26H0417Z": {
    nmc_pin: "26H0417Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 17",
    nmc_regexpirydate: "20/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "23/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "No",
    register_parts: ["Nursing", "Nursing", "Nursing"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "AN1",
        nmc_academiclevel: "B Nurs (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: "BN (Hons) Adult Nursing",
      },
    ],
  },
  "26H0418Z": {
    nmc_pin: "26H0418Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 18",
    nmc_regexpirydate: "21/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "24/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "No",
    register_parts: ["Midwifery", "Midwifery"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "M",
        nmc_programmecode: "MW1",
        nmc_academiclevel: "Level 6",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: null,
      },
    ],
  },
  "26H0419Z": {
    nmc_pin: "26H0419Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 19",
    nmc_regexpirydate: "22/09/2027",
    nmc_addedby: "Rick Flair",
    nmc_createdon: "25/11/2025",
    nmc_institutecode: MOCK_INSTITUTE_CODE,
    nmc_institutename: MOCK_INSTITUTE_NAME,
    nmc_active: "No",
    register_parts: ["Nursing", "Nursing"],
    practice_types: [],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "SC1",
        nmc_academiclevel: "B Nurs (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: MOCK_INSTITUTE_NAME,
        nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing",
      },
    ],
  },
};

// AEI Programme Title per course choice, mirroring the real backend's
// resolve_course_title join (institute + training type + programme +
// academic route + qualification level -> Programme.nmc_aeiprogrammetitle) -
// this is NOT the same field as CourseChoice.nmc_programmename (Programme
// Title, shown in the Lookup pop-up itself); Add Course only learns the
// resolved AEI Programme Title once the course is looked up again for
// display, same two-step shape as the real API.
const MOCK_AEI_PROGRAMME_TITLES: Record<string, string> = {
  "R|AN1|B Nurs (Hons)|A": "BN (Hons) Adult Nursing Apprenticeship",
  "R|AN1|B Nurs (Hons)|F": "BN (Hons) Adult Nursing",
  "R|SC1|B Nurs (Hons)|A": "BN (Hons) Children's Nursing Apprenticeship",
  "R|SC1|B Nurs (Hons)|F": "BN (Hons) Children's Nursing",
  "F|P2|Level 7|F": "Community Practitioner Nurse Prescribing V150 (L7)",
  "F|P2|Level 7|P": "Advancing Community Practitioner Nurse Prescribing V150 (level seven)",
  "S|DF3|PG Dip|F":
    "Post Graduate Diploma Specialist Practice Qualification- District Nursing with integrated Independent and Supplementary Prescribing (V300)",
  "S|DF3|PG Dip|A": "Specialist Practice Qualification District Nurse (Apprenticeship)",
};

export function resolveCourseTitle(choice: CourseChoice): string | null {
  const key = `${choice.nmc_trainingtype}|${choice.nmc_programme}|${choice.nmc_academicroute}|${choice.nmc_qualificationlevel}`;
  return MOCK_AEI_PROGRAMME_TITLES[key] ?? null;
}

// Mirrors backend/app/services/signatories.py's slot selection (Add Course
// only ever targets slots 2-5, first empty in order - never slot 1, which
// mirrors the top-level course fields set at data creation).
const ADD_SLOTS = [2, 3, 4, 5];

export function firstEmptyAddSlot(courses: CourseRow[]): number | null {
  const used = new Set(courses.map((c) => c.slot));
  return ADD_SLOTS.find((slot) => !used.has(slot)) ?? null;
}

export function courseFromChoice(slot: number, instituteName: string, choice: CourseChoice): CourseRow {
  return {
    slot,
    nmc_trainingtypecode: choice.nmc_trainingtype,
    nmc_programmecode: choice.nmc_programme,
    nmc_academiclevel: choice.nmc_academicroute,
    nmc_qualificationroute: choice.nmc_qualificationlevel,
    nmc_institutename: instituteName,
    nmc_aeiprogrammetitle: resolveCourseTitle(choice),
  };
}

// Mirrors backend/app/services/signatories.py's match_applicant - active-only,
// exact PIN + surname match.
export function matchSignatory(pin: string, lastname: string): SignatoryDetail | null {
  const detail = MOCK_SIGNATORY_DETAILS[pin];
  if (!detail || detail.nmc_lastname !== lastname || detail.nmc_active !== "Yes") return null;
  return detail;
}

function courseConcat(pin: string): string {
  const course1 = MOCK_SIGNATORY_DETAILS[pin].courses[0];
  return `${course1.nmc_trainingtypecode}${course1.nmc_programmecode}`;
}

function toListItem(pin: string): SignatoryListItem {
  const detail = MOCK_SIGNATORY_DETAILS[pin];
  return {
    nmc_pin: detail.nmc_pin,
    nmc_lastname: detail.nmc_lastname,
    nmc_firstname: detail.nmc_firstname,
    approved_course_title: courseConcat(pin),
    register_parts: detail.register_parts,
    practice_types: detail.practice_types,
    nmc_regexpirydate: detail.nmc_regexpirydate,
    nmc_createdon: detail.nmc_createdon,
    nmc_addedby: detail.nmc_addedby,
    nmc_active: detail.nmc_active,
  };
}

export const MOCK_SIGNATORIES: SignatoryListItem[] = [
  "26H0401Z",
  "26H0402Z",
  "26H0499Z",
  "26H0405Z",
  "26H0407Z",
  "26H0417Z",
  "26H0418Z",
  "26H0419Z",
].map(toListItem);

// Enough rows for 26H0499Z to demonstrate real pagination (5/page); a couple
// for 26H0401Z to show the empty/short case works too.
export const MOCK_AUDITS: Record<string, AuditRecordEntry[]> = {
  "26H0499Z": [
    {
      id: 7,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-08-20T11:46:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "",
      nmc_newvalue: "RSC1",
      nmc_addedby: "User1",
    },
    {
      id: 6,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-07-22T17:47:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "RF2",
      nmc_newvalue: "",
      nmc_addedby: "User1",
    },
    {
      id: 5,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-07-21T11:50:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "",
      nmc_newvalue: "RF2",
      nmc_addedby: "User1",
    },
    {
      id: 4,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-06-16T12:57:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "",
      nmc_newvalue: "SDF3",
      nmc_addedby: "User1",
    },
    {
      id: 3,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-06-16T11:45:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "SDF3",
      nmc_newvalue: "",
      nmc_addedby: "User1",
    },
    {
      id: 2,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-05-23T11:58:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "",
      nmc_newvalue: "SDF3",
      nmc_addedby: "User1",
    },
    {
      id: 1,
      nmc_pin: "26H0499Z",
      nmc_lastname: "P",
      nmc_firstname: "Sai",
      nmc_modifiedon: "2026-05-09T17:17:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "",
      nmc_newvalue: "RAN",
      nmc_addedby: "User1",
    },
  ],
  "26H0401Z": [
    {
      id: 9,
      nmc_pin: "26H0401Z",
      nmc_lastname: "Young",
      nmc_firstname: "Mary 1",
      nmc_modifiedon: "2026-08-01T09:12:00+00:00",
      nmc_attributechanged: "Approved Course",
      nmc_previousvalue: "",
      nmc_newvalue: "RAN1",
      nmc_addedby: "User1",
    },
  ],
};
