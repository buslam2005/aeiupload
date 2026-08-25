import { describe, expect, it } from "vitest";
import {
  allErrorMessages,
  distinctBy,
  getFieldError,
  instituteLabel,
  nameLabel,
  programmeLabel,
  programmeTitleLabel,
  rowProgrammeLabel,
  toBritishDateTime,
  toIsoDate,
  uploadSummaryPath,
} from "./format";
import type { UploadStudent } from "./types";

function makeRow(overrides: Partial<UploadStudent> = {}): UploadStudent {
  return {
    id: 1,
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
    nmc_email: "rose@example.com",
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
    nmc_error1description: null,
    nmc_error2description: null,
    nmc_error3description: null,
    nmc_error4description: null,
    nmc_error5description: null,
    nmc_programmename: "Pre-registration nursing - Child",
    institute_name: "University of Chester",
    ...overrides,
  };
}

describe("uploadSummaryPath", () => {
  it("builds an institute-scoped Upload Summary URL when both code and name are known", () => {
    expect(uploadSummaryPath("1315", "University of Chester")).toBe(
      "/upload-summary?institute_code=1315&institute_name=University+of+Chester"
    );
  });

  it("falls back to the bare path when the institute is missing or unresolved", () => {
    expect(uploadSummaryPath(null, null)).toBe("/upload-summary");
    expect(uploadSummaryPath("1315", null)).toBe("/upload-summary");
    expect(uploadSummaryPath(undefined, undefined)).toBe("/upload-summary");
  });
});

describe("instituteLabel", () => {
  it("concatenates name, hyphen, code", () => {
    expect(instituteLabel({ name: "University of Chester", code: "1315" })).toBe(
      "University of Chester - 1315"
    );
  });
});

describe("programmeLabel", () => {
  it("hyphen-joins training type, programme, route, programme name", () => {
    expect(
      programmeLabel({
        nmc_trainingtype: "R",
        nmc_programme: "SC1",
        nmc_academicroute: "B Nurs (Hons)",
        nmc_programmename: "Pre-registration nursing - Child",
      })
    ).toBe("R-SC1-B Nurs (Hons)-Pre-registration nursing - Child");
  });
});

describe("programmeTitleLabel", () => {
  it("hyphen-joins training type, programme, route, and qualification level", () => {
    expect(
      programmeTitleLabel({
        nmc_trainingtype: "R",
        nmc_programme: "SC1",
        nmc_academicroute: "B Nurs (Hons)",
        nmc_qualificationlevel: "6",
      })
    ).toBe("R-SC1-B Nurs (Hons)-6");
  });
});

describe("rowProgrammeLabel", () => {
  it("returns the same 4-field label as programmeLabel when all fields present", () => {
    expect(rowProgrammeLabel(makeRow())).toBe("R-SC1-B Nurs (Hons)-Pre-registration nursing - Child");
  });

  it("returns null when the programme name could not be resolved", () => {
    expect(rowProgrammeLabel(makeRow({ nmc_programmename: null }))).toBeNull();
  });

  it("returns null when a programme component is missing", () => {
    expect(rowProgrammeLabel(makeRow({ nmc_trainingtype: null }))).toBeNull();
  });
});

describe("nameLabel", () => {
  it("concatenates pin, first name, last name with hyphens", () => {
    expect(nameLabel(makeRow())).toBe("16H0404E-ROSE 1-LEE");
  });

  it("tolerates missing fields", () => {
    expect(nameLabel(makeRow({ nmc_firstname: null }))).toBe("16H0404E--LEE");
  });
});

describe("toIsoDate", () => {
  it("converts YYYYMMDD to YYYY-MM-DD", () => {
    expect(toIsoDate("20020524")).toBe("2002-05-24");
  });

  it("passes through null as an empty string", () => {
    expect(toIsoDate(null)).toBe("");
  });

  it("passes through a value that isn't 8 digits unchanged", () => {
    expect(toIsoDate("not-a-date")).toBe("not-a-date");
  });
});

describe("toBritishDateTime", () => {
  it("formats a UTC winter timestamp as GMT (DD/MM/YYYY hh:mm AM/PM)", () => {
    // 2026-01-15 09:05 UTC == 09:05 GMT in winter (no DST offset)
    expect(toBritishDateTime("2026-01-15T09:05:00Z")).toBe("15/01/2026 9:05 AM");
  });

  it("formats a UTC summer timestamp as BST (+1 hour)", () => {
    // 2026-07-15 09:05 UTC == 10:05 BST in summer
    expect(toBritishDateTime("2026-07-15T09:05:00Z")).toBe("15/07/2026 10:05 AM");
  });
});

describe("getFieldError / allErrorMessages", () => {
  it("finds the message for a field by matching its message prefix, regardless of slot", () => {
    const row = makeRow({
      nmc_error1description: "Programme does not match with organization's record.",
      nmc_error2description: "Date of birth does not match with organization's record.",
    });
    expect(getFieldError(row, "Date of birth")).toBe(
      "Date of birth does not match with organization's record."
    );
    expect(getFieldError(row, "First name")).toBeUndefined();
  });

  it("collects all populated error slots in order", () => {
    const row = makeRow({
      nmc_error1description: "Programme does not match with organization's record.",
      nmc_error3description: "Last name does not match with organization's record.",
    });
    expect(allErrorMessages(row)).toEqual([
      "Programme does not match with organization's record.",
      "Last name does not match with organization's record.",
    ]);
  });
});

describe("distinctBy", () => {
  it("keeps the first item for each key and preserves order", () => {
    const items = [
      { id: 1, title: "A" },
      { id: 2, title: "B" },
      { id: 3, title: "A" },
      { id: 4, title: "C" },
    ];
    expect(distinctBy(items, (i) => i.title)).toEqual([
      { id: 1, title: "A" },
      { id: 2, title: "B" },
      { id: 4, title: "C" },
    ]);
  });

  it("returns an empty array for an empty input", () => {
    expect(distinctBy([], (i: { title: string }) => i.title)).toEqual([]);
  });
});
