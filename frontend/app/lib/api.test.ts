import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteUploadStudent,
  getBatch,
  getBatches,
  getInstitutes,
  resubmitFull,
  resubmitWithProgramme,
  toResubmitFullPayload,
  uploadAlternatePath,
  uploadOriginalPath,
} from "./api";
import type { UploadStudent } from "./types";

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const ROW: UploadStudent = {
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
  institute_name: "University of Chester",
};

describe("apiFetch error handling", () => {
  it("throws a generic message when the response is not ok and has no JSON detail", async () => {
    mockFetch({ ok: false, status: 404 });
    await expect(getBatch(999)).rejects.toThrow("/batches/999 failed: 404");
  });

  it("throws the backend's own detail message when the error response has one", async () => {
    // FastAPI's HTTPException(detail=...) responses - e.g. the file-upload
    // error messages from requirements.md's "Error handling at file upload" -
    // must reach the caller verbatim so it can show the same text to the user.
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({
        detail: "Column header(s) are wrong. Please check the file before upload it again.",
      }),
    });
    await expect(getBatch(999)).rejects.toThrow(
      "Column header(s) are wrong. Please check the file before upload it again."
    );
  });

  it("returns undefined for a 204 No Content response", async () => {
    mockFetch({ status: 204 });
    await expect(deleteUploadStudent(1)).resolves.toBeUndefined();
  });
});

describe("getInstitutes", () => {
  it("GETs /api/institutes", async () => {
    const fetchMock = mockFetch({ json: async () => [] });
    await getInstitutes();
    expect(fetchMock).toHaveBeenCalledWith("/api/institutes", undefined);
  });
});

describe("getBatches", () => {
  it("GETs /api/batches scoped to the given institute code", async () => {
    // Upload Summary is scoped to the selected institute - without this
    // filter, every institute's upload history would show up regardless of
    // which one is currently selected.
    const fetchMock = mockFetch({ json: async () => [] });
    await getBatches("1315");
    expect(fetchMock).toHaveBeenCalledWith("/api/batches?institute_code=1315", undefined);
  });

  it("GETs unfiltered /api/batches when no institute code is given", async () => {
    const fetchMock = mockFetch({ json: async () => [] });
    await getBatches();
    expect(fetchMock).toHaveBeenCalledWith("/api/batches", undefined);
  });
});

describe("uploadAlternatePath / uploadOriginalPath", () => {
  it("posts a FormData body with the selected programme fields", async () => {
    const fetchMock = mockFetch({ json: async () => ({}) });
    const file = new File(["data"], "students.csv", { type: "text/csv" });

    await uploadAlternatePath({
      instituteCode: "1315",
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
      file,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/uploads/alternate-path");
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("institute_code")).toBe("1315");
    expect(body.get("nmc_programme")).toBe("SC1");
    expect(body.get("file")).toBe(file);
  });

  it("omits optional programme fields for the original path when not chosen", async () => {
    const fetchMock = mockFetch({ json: async () => ({}) });
    const file = new File(["data"], "students.csv", { type: "text/csv" });

    await uploadOriginalPath({ instituteCode: "1315", file });

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("institute_code")).toBe("1315");
    expect(body.has("nmc_programme")).toBe(false);
    expect(body.has("nmc_academicroute")).toBe(false);
  });
});

describe("resubmitWithProgramme", () => {
  it("posts the ids and revised programme as JSON", async () => {
    const fetchMock = mockFetch({ json: async () => [] });
    await resubmitWithProgramme({
      uploadStudentIds: [202, 203],
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload-students/resubmit-with-programme");
    expect(JSON.parse(init.body)).toEqual({
      upload_student_ids: [202, 203],
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
    });
  });
});

describe("toResubmitFullPayload / resubmitFull", () => {
  it("keeps only the business fields ResubmitFullRequest accepts", () => {
    const payload = toResubmitFullPayload(ROW);
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("nmc_rowstatus");
    expect(payload).not.toHaveProperty("nmc_error1description");
    expect(payload).not.toHaveProperty("nmc_programmename");
    expect(payload).not.toHaveProperty("institute_name");
    expect(payload.nmc_firstname).toBe("WRONG NAME");
    expect(payload.nmc_traininginstitutecode).toBe("1315");
  });

  it("posts the payload to the resubmit-full endpoint", async () => {
    const fetchMock = mockFetch({ json: async () => ROW });
    await resubmitFull(202, toResubmitFullPayload(ROW));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload-students/202/resubmit-full");
    expect(JSON.parse(init.body).nmc_firstname).toBe("WRONG NAME");
  });
});
