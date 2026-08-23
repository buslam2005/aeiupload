import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadResultPage from "./page";
import type { BatchDetail, ProgrammeChoice, ProgrammeTitleChoice, UploadStudent } from "../lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("batchId=4"),
}));

const getBatch = vi.fn();
const getProgrammes = vi.fn();
const getProgrammeTitles = vi.fn();
vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    getBatch: (id: number) => getBatch(id),
    getProgrammes: (code: string) => getProgrammes(code),
    getProgrammeTitles: (code: string) => getProgrammeTitles(code),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

const PROGRAMME_CHOICES: ProgrammeChoice[] = [];
const PROGRAMME_TITLE_CHOICES: ProgrammeTitleChoice[] = [];

function makeErrorRow(id: number, overrides: Partial<UploadStudent> = {}): UploadStudent {
  return {
    id,
    upload_batch_id: 4,
    nmc_linenumber: id,
    nmc_nmcpin: `PIN${id}`,
    nmc_nmctitlename: "Miss",
    nmc_firstname: "First",
    nmc_maidenname: null,
    nmc_lastname: "Last",
    nmc_dateofbirth: null,
    nmc_gender: null,
    nmc_nationalityname: null,
    nmc_countryofbirthname: null,
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
    nmc_error1description: "NMC PIN does not match with organization's record.",
    nmc_error2description: null,
    nmc_error3description: null,
    nmc_error4description: null,
    nmc_error5description: null,
    nmc_programmename: null,
    institute_name: "University of Chester",
    ...overrides,
  };
}

function makeBatch(errorRecords: UploadStudent[]): BatchDetail {
  return {
    nmc_uploadbatchid: 4,
    nmc_uploadbatchtime: "2026-08-21T14:03:01+00:00",
    nmc_uploadby: "User1",
    nmc_institutecode: "1315",
    institute_name: "University of Chester",
    nmc_programme: null,
    nmc_academicroute: null,
    nmc_filename: "upload.xlsx",
    nmc_totalrecords: errorRecords.length,
    nmc_totalsuccessrecords: 0,
    nmc_totalfailedrecords: errorRecords.length,
    status: errorRecords.length > 0 ? "Failed" : "Processing Complete",
    uploaded_records: [],
    error_records: errorRecords,
  };
}

function firePageShow(persisted: boolean) {
  const event = new Event("pageshow") as PageTransitionEvent & Event;
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
}

describe("UploadResultPage - bfcache staleness fix", () => {
  it("re-fetches the batch when the page is restored from the back/forward cache", async () => {
    getBatch.mockResolvedValueOnce(makeBatch([makeErrorRow(1), makeErrorRow(2)]));
    getProgrammes.mockResolvedValue(PROGRAMME_CHOICES);
    getProgrammeTitles.mockResolvedValue(PROGRAMME_TITLE_CHOICES);
    render(<UploadResultPage />);

    expect(await screen.findByText("PIN1")).toBeInTheDocument();
    expect(screen.getByText("PIN2")).toBeInTheDocument();
    expect(getBatch).toHaveBeenCalledTimes(1);

    // Simulate row 1 having been deleted server-side (e.g. via the Delete
    // link) after this page was first loaded, then the browser restoring
    // this page from bfcache on a "back" navigation from View Details.
    getBatch.mockResolvedValueOnce(makeBatch([makeErrorRow(2)]));
    firePageShow(true);

    // ErrorRecordsSubgrid remounts (via its `key`) when the reload lands, so
    // re-query live on every retry rather than asserting on a node reference
    // captured by a single findByText call - that reference can be detached
    // by the remount between being returned and being asserted on.
    await waitFor(() => {
      expect(screen.queryByText("PIN1")).not.toBeInTheDocument();
      expect(screen.getByText("PIN2")).toBeInTheDocument();
    });
    expect(getBatch).toHaveBeenCalledTimes(2);
  });

  it("does not re-fetch on a pageshow that isn't a bfcache restore", async () => {
    getBatch.mockResolvedValue(makeBatch([makeErrorRow(1)]));
    getProgrammes.mockResolvedValue(PROGRAMME_CHOICES);
    getProgrammeTitles.mockResolvedValue(PROGRAMME_TITLE_CHOICES);
    render(<UploadResultPage />);

    expect(await screen.findByText("PIN1")).toBeInTheDocument();
    expect(getBatch).toHaveBeenCalledTimes(1);

    firePageShow(false);
    await Promise.resolve();

    expect(getBatch).toHaveBeenCalledTimes(1);
  });
});
