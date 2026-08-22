import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ErrorRecordsSubgrid from "./ErrorRecordsSubgrid";
import type { ProgrammeChoice, UploadStudent } from "../lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const PROGRAMME_CHOICES: ProgrammeChoice[] = [
  { nmc_trainingtype: "R", nmc_programme: "SC1", nmc_academicroute: "B Nurs (Hons)", nmc_programmename: "Pre-registration nursing - Child" },
];

function makeRow(id: number, overrides: Partial<UploadStudent> = {}): UploadStudent {
  return {
    id,
    upload_batch_id: 1,
    nmc_linenumber: id,
    nmc_nmcpin: `PIN${id}`,
    nmc_nmctitlename: "Miss",
    nmc_firstname: "First",
    nmc_maidenname: null,
    nmc_lastname: "Last",
    nmc_dateofbirth: "20020524",
    nmc_gender: "F",
    nmc_nationalityname: "British",
    nmc_countryofbirthname: "England",
    nmc_email: null,
    nmc_addressline1: null,
    nmc_addressline2: null,
    nmc_addressline3: null,
    nmc_city: null,
    nmc_postcode: null,
    nmc_countryname: null,
    nmc_traininginstitutecode: "1315",
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_coursestartdate: null,
    nmc_courseenddate: null,
    nmc_trainingexampassdate: null,
    nmc_trainingstartdate: null,
    nmc_trainingcompletiondate: null,
    nmc_rowuploadtime: "2026-08-21T14:03:01+00:00",
    nmc_rowstatus: "Failed",
    nmc_error1description: "First name does not match with organization's record.",
    nmc_error2description: null,
    nmc_error3description: null,
    nmc_error4description: null,
    nmc_error5description: null,
    nmc_programmename: "Pre-registration nursing - Child",
    ...overrides,
  };
}

describe("ErrorRecordsSubgrid", () => {
  it("renders one row per error record", () => {
    render(<ErrorRecordsSubgrid initialRows={[makeRow(1), makeRow(2)]} programmeChoices={PROGRAMME_CHOICES} />);
    expect(screen.getByText("PIN1")).toBeInTheDocument();
    expect(screen.getByText("PIN2")).toBeInTheDocument();
  });

  it("shows the empty state when there are no error records", () => {
    render(<ErrorRecordsSubgrid initialRows={[]} programmeChoices={PROGRAMME_CHOICES} />);
    expect(screen.getByText("There are no records to display.")).toBeInTheDocument();
  });

  it("select-all checkbox checks and unchecks every row checkbox", async () => {
    const user = userEvent.setup();
    render(<ErrorRecordsSubgrid initialRows={[makeRow(1), makeRow(2)]} programmeChoices={PROGRAMME_CHOICES} />);

    const checkboxes = screen.getAllByRole("checkbox");
    const [selectAll, row1, row2] = checkboxes;
    expect(row1).not.toBeChecked();
    expect(row2).not.toBeChecked();

    await user.click(selectAll);
    expect(row1).toBeChecked();
    expect(row2).toBeChecked();

    await user.click(selectAll);
    expect(row1).not.toBeChecked();
    expect(row2).not.toBeChecked();
  });

  it("deleting a row removes it from the grid", async () => {
    const user = userEvent.setup();
    render(<ErrorRecordsSubgrid initialRows={[makeRow(1), makeRow(2)]} programmeChoices={PROGRAMME_CHOICES} />);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    expect(screen.queryByText("PIN1")).not.toBeInTheDocument();
    expect(screen.getByText("PIN2")).toBeInTheDocument();
  });

  it("bulk Submit is disabled until rows are selected and a revised programme is chosen", () => {
    render(<ErrorRecordsSubgrid initialRows={[makeRow(1)]} programmeChoices={PROGRAMME_CHOICES} />);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
