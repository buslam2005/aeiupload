import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ViewDetailsPage from "./page";
import type { UploadStudent } from "../lib/types";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
  useSearchParams: () => new URLSearchParams("studentId=1"),
}));

const getUploadStudent = vi.fn();
const resubmitFull = vi.fn();
vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    getUploadStudent: (id: number) => getUploadStudent(id),
    resubmitFull: (id: number, payload: unknown) => resubmitFull(id, payload),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeStudent(overrides: Partial<UploadStudent> = {}): UploadStudent {
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
    nmc_email: null,
    nmc_addressline1: null,
    nmc_addressline2: null,
    nmc_addressline3: null,
    nmc_city: null,
    nmc_postcode: null,
    nmc_countryname: null,
    nmc_traininginstitutecode: "1315",
    nmc_trainingtype: "R",
    nmc_programme: "AN1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_coursestartdate: "20200901",
    nmc_courseenddate: "20290901",
    nmc_trainingexampassdate: "20260812",
    nmc_trainingstartdate: null,
    nmc_trainingcompletiondate: null,
    nmc_rowuploadtime: "2026-08-21T14:03:01+00:00",
    nmc_rowstatus: "Failed",
    nmc_error1description: "NMC programme does not match with organization's record.",
    nmc_error2description: null,
    nmc_error3description: null,
    nmc_error4description: null,
    nmc_error5description: null,
    nmc_programmename: null,
    institute_name: "University of Chester",
    ...overrides,
  };
}

describe("ViewDetailsPage - Student Details tab", () => {
  it("labels the name fields correctly and orders Last Name right after First Name", async () => {
    getUploadStudent.mockResolvedValue(makeStudent());
    render(<ViewDetailsPage />);

    expect(await screen.findByLabelText("First Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Middle Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Maiden Name")).toBeInTheDocument();
    expect(screen.queryByText(/Middle Name\(s\)/)).not.toBeInTheDocument();
    expect(screen.queryByText("Previous Last Name")).not.toBeInTheDocument();

    const labels = screen.getAllByText(/^(First Name|Last Name|Middle Name|Maiden Name)/, {
      selector: "label",
    });
    expect(labels.map((l) => l.textContent)).toEqual([
      "First Name *",
      "Last Name",
      "Middle Name",
      "Maiden Name",
    ]);
  });

  it("shows nmc_lastname's value in the Last Name field and lets it be edited", async () => {
    getUploadStudent.mockResolvedValue(makeStudent({ nmc_lastname: "LEE" }));
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    const lastName = await screen.findByLabelText("Last Name");
    expect(lastName).toHaveValue("LEE");

    await user.clear(lastName);
    await user.type(lastName, "SMITH");
    expect(lastName).toHaveValue("SMITH");
  });

  it("Middle Name and Maiden Name fields are editable", async () => {
    getUploadStudent.mockResolvedValue(makeStudent());
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    const middleName = await screen.findByLabelText("Middle Name");
    await user.type(middleName, "ANNE");
    expect(middleName).toHaveValue("ANNE");

    const maidenName = screen.getByLabelText("Maiden Name");
    await user.type(maidenName, "JONES");
    expect(maidenName).toHaveValue("JONES");
  });

  it("shows Country of Birth underneath Nationality, bound to nmc_countryofbirthname and editable", async () => {
    getUploadStudent.mockResolvedValue(makeStudent({ nmc_countryofbirthname: "Nigeria" }));
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    const countryOfBirth = await screen.findByLabelText("Country of Birth");
    expect(countryOfBirth).toHaveValue("Nigeria");

    const labels = screen.getAllByText(/^(Nationality|Country of Birth)/, { selector: "label" });
    expect(labels.map((l) => l.textContent)).toEqual(["Nationality *", "Country of Birth"]);

    await user.clear(countryOfBirth);
    await user.type(countryOfBirth, "Ghana");
    expect(countryOfBirth).toHaveValue("Ghana");
  });

  it("shows a Country of Birth mismatch error under the field, same as other fields", async () => {
    getUploadStudent.mockResolvedValue(
      makeStudent({
        nmc_error1description: "Country of birth does not match with organization's record.",
      })
    );
    render(<ViewDetailsPage />);

    expect(
      await screen.findByText("Country of birth does not match with organization's record.")
    ).toBeInTheDocument();
  });
});

describe("ViewDetailsPage - Programme Information tab", () => {
  it("shows an Institute Code field, editable, bound to nmc_traininginstitutecode", async () => {
    getUploadStudent.mockResolvedValue(makeStudent({ nmc_traininginstitutecode: "1315" }));
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    await user.click(await screen.findByRole("button", { name: "3. Programme Information" }));

    const instituteCode = screen.getByLabelText("Institute Code");
    expect(instituteCode).toHaveValue("1315");
    await user.clear(instituteCode);
    await user.type(instituteCode, "9999");
    expect(instituteCode).toHaveValue("9999");
  });

  it("shows the matching error message under the field it belongs to, same as other tabs", async () => {
    getUploadStudent.mockResolvedValue(
      makeStudent({
        nmc_error1description: "NMC programme does not match with organization's record.",
      })
    );
    render(<ViewDetailsPage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "3. Programme Information" }));

    expect(
      screen.getByText("NMC programme does not match with organization's record.")
    ).toBeInTheDocument();
  });
});

describe("ViewDetailsPage - resubmit redirect uses the server's fresh institute context", () => {
  it("redirects using the resubmit response's institute_name, not the stale one the page loaded with", async () => {
    // The row loaded with a wrong Institute Code (9999), which the backend
    // couldn't resolve to a real institute - institute_name is null. The
    // user corrects it to a real one and resubmits.
    getUploadStudent.mockResolvedValue(
      makeStudent({ nmc_traininginstitutecode: "9999", institute_name: null })
    );
    resubmitFull.mockResolvedValue(
      makeStudent({ nmc_traininginstitutecode: "1315", institute_name: "University of Chester" })
    );
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    await user.click(await screen.findByRole("button", { name: "3. Programme Information" }));
    const instituteCode = screen.getByLabelText("Institute Code");
    await user.clear(instituteCode);
    await user.type(instituteCode, "1315");
    await user.click(screen.getByRole("button", { name: "Resubmit" }));

    // If this used the stale, pre-edit institute_name (null), it would send
    // the user to a bare "/upload-summary" with no institute context at all.
    expect(push).toHaveBeenCalledWith(
      "/upload-summary?institute_code=1315&institute_name=University+of+Chester"
    );
  });
});
