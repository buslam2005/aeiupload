import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorRecordsSubgrid from "./ErrorRecordsSubgrid";
import type { ProgrammeChoice, ProgrammeTitleChoice, UploadStudent } from "../lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockClear();
});

const PROGRAMME_CHOICES: ProgrammeChoice[] = [
  { nmc_trainingtype: "R", nmc_programme: "SC1", nmc_academicroute: "B Nurs (Hons)", nmc_programmename: "Pre-registration nursing - Child" },
];

const PROGRAMME_TITLE_CHOICES: ProgrammeTitleChoice[] = [
  {
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing",
  },
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
    institute_name: "University of Chester",
    ...overrides,
  };
}

function renderGrid(rows: UploadStudent[]) {
  return render(
    <ErrorRecordsSubgrid
      initialRows={rows}
      programmeChoices={PROGRAMME_CHOICES}
      programmeTitleChoices={PROGRAMME_TITLE_CHOICES}
      instituteCode="1315"
      instituteName="University of Chester"
    />
  );
}

describe("ErrorRecordsSubgrid", () => {
  it("renders one row per error record", () => {
    renderGrid([makeRow(1), makeRow(2)]);
    expect(screen.getByText("PIN1")).toBeInTheDocument();
    expect(screen.getByText("PIN2")).toBeInTheDocument();
  });

  it("shows the empty state when there are no error records", () => {
    renderGrid([]);
    expect(screen.getByText("There are no records to display.")).toBeInTheDocument();
  });

  it("select-all checkbox checks and unchecks every row checkbox", async () => {
    const user = userEvent.setup();
    renderGrid([makeRow(1), makeRow(2)]);

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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
    const user = userEvent.setup();
    renderGrid([makeRow(1), makeRow(2)]);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    expect(await screen.findByText("PIN2")).toBeInTheDocument();
    expect(screen.queryByText("PIN1")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/upload-students/1", { method: "DELETE" });
  });

  it("bulk Submit is disabled until rows are selected and a revised programme is chosen", () => {
    renderGrid([makeRow(1)]);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("bulk resubmit posts the selected ids and revised programme, then navigates to Upload Summary with the batch's institute context", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderGrid([makeRow(1), makeRow(2)]);

    await user.click(screen.getAllByRole("checkbox")[1]); // row 1's own checkbox
    await user.selectOptions(screen.getByLabelText("Revised Programme"), "R|SC1|B Nurs (Hons)");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/upload-students/resubmit-with-programme",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      upload_student_ids: [1],
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
    });
    expect(push).toHaveBeenCalledWith(
      "/upload-summary?institute_code=1315&institute_name=University+of+Chester"
    );
  });

  it("per-row Revised Programme column lists distinct programme titles, not the concatenated label", () => {
    renderGrid([makeRow(1)]);
    const rowSelect = screen.getAllByRole("combobox")[1];
    expect(within(rowSelect).getByText("BN (Hons) Children's Nursing")).toBeInTheDocument();
    expect(
      within(rowSelect).queryByText("R-SC1-B Nurs (Hons)-Pre-registration nursing - Child")
    ).not.toBeInTheDocument();
  });

  it("resubmitting a single row posts the programme triple behind the selected title", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderGrid([makeRow(1)]);

    const rowSelect = screen.getAllByRole("combobox")[1];
    await user.selectOptions(rowSelect, "R|SC1|B Nurs (Hons)|BN (Hons) Children's Nursing");
    await user.click(screen.getByRole("button", { name: "Resubmit" }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      upload_student_ids: [1],
      nmc_trainingtype: "R",
      nmc_programme: "SC1",
      nmc_academicroute: "B Nurs (Hons)",
    });
  });

  it("remounting with a fresh initialRows array (the parent's fix for stale bfcache renders) drops rows no longer present", () => {
    // upload-result/page.tsx remounts ErrorRecordsSubgrid via a changing `key`
    // whenever it reloads (on mount and on bfcache restore), rather than
    // relying on this component to notice initialRows changed - this
    // reproduces that remount and confirms it picks up the fresh data.
    const { rerender } = render(
      <ErrorRecordsSubgrid
        key="load-1"
        initialRows={[makeRow(1), makeRow(2)]}
        programmeChoices={PROGRAMME_CHOICES}
        programmeTitleChoices={PROGRAMME_TITLE_CHOICES}
        instituteCode="1315"
        instituteName="University of Chester"
      />
    );
    expect(screen.getByText("PIN1")).toBeInTheDocument();

    rerender(
      <ErrorRecordsSubgrid
        key="load-2"
        initialRows={[makeRow(2)]}
        programmeChoices={PROGRAMME_CHOICES}
        programmeTitleChoices={PROGRAMME_TITLE_CHOICES}
        instituteCode="1315"
        instituteName="University of Chester"
      />
    );

    expect(screen.queryByText("PIN1")).not.toBeInTheDocument();
    expect(screen.getByText("PIN2")).toBeInTheDocument();
  });
});
