import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorRecordsSubgrid from "./ErrorRecordsSubgrid";
import type { ProgrammeTitleChoice, UploadStudent } from "../lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  push.mockClear();
});

const PROGRAMME_TITLE_CHOICES: ProgrammeTitleChoice[] = [
  {
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "6",
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

  it("select-all is the only selection control - there are no per-row checkboxes", () => {
    renderGrid([makeRow(1), makeRow(2)]);
    // Business decision: per-row checkboxes were removed as redundant with
    // each row's own Revised Programme + Resubmit controls. Select-all is
    // the only remaining way to populate the bulk Submit selection.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByRole("checkbox", { name: "select all" })).not.toBeChecked();
  });

  it("select-all toggles the bulk selection between every row and none", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderGrid([makeRow(1), makeRow(2)]);

    const selectAll = screen.getByRole("checkbox", { name: "select all" });
    await user.click(selectAll);
    expect(selectAll).toBeChecked();

    await user.selectOptions(
      screen.getByLabelText("Revised Programme"),
      "R|SC1|B Nurs (Hons)|BN (Hons) Children's Nursing"
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.upload_student_ids).toEqual([1, 2]);
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
    renderGrid([makeRow(1)]);

    await user.click(screen.getByRole("checkbox", { name: "select all" }));
    await user.selectOptions(
      screen.getByLabelText("Revised Programme"),
      "R|SC1|B Nurs (Hons)|BN (Hons) Children's Nursing"
    );
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

  it("bulk Revised Programme drop-down shows the training type/programme/route/qualification level/title concatenation", () => {
    renderGrid([makeRow(1)]);
    const bulkSelect = screen.getByLabelText("Revised Programme");
    expect(
      within(bulkSelect).getByText("R-SC1-B Nurs (Hons)-6-BN (Hons) Children's Nursing")
    ).toBeInTheDocument();
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
        programmeTitleChoices={PROGRAMME_TITLE_CHOICES}
        instituteCode="1315"
        instituteName="University of Chester"
      />
    );

    expect(screen.queryByText("PIN1")).not.toBeInTheDocument();
    expect(screen.getByText("PIN2")).toBeInTheDocument();
  });
});
