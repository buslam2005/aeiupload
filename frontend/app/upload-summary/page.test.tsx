import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadSummaryPage from "./page";
import type { BatchSummary } from "../lib/types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("institute_code=1315&institute_name=University+of+Chester"),
}));

const getBatches = vi.fn();
vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    getBatches: (instituteCode?: string) => getBatches(instituteCode),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeBatch(id: number, instituteCode: string, instituteName: string): BatchSummary {
  return {
    nmc_uploadbatchid: id,
    nmc_uploadbatchtime: "2026-08-23T14:03:01+00:00",
    nmc_uploadby: "User1",
    nmc_institutecode: instituteCode,
    institute_name: instituteName,
    nmc_programme: null,
    nmc_academicroute: null,
    nmc_filename: "students.csv",
    nmc_totalrecords: 1,
    nmc_totalsuccessrecords: 1,
    nmc_totalfailedrecords: 0,
    status: "Processing Complete",
  };
}

describe("UploadSummaryPage - institute-scoped history", () => {
  it("fetches batches scoped to the institute in the URL, not every institute's history", async () => {
    getBatches.mockResolvedValue([makeBatch(14, "1315", "University of Chester")]);
    render(<UploadSummaryPage />);

    expect(await screen.findByRole("cell", { name: "14" })).toBeInTheDocument();
    expect(getBatches).toHaveBeenCalledWith("1315");
  });

  it("does not show a batch belonging to a different institute", async () => {
    // Backend now filters by institute_code, so this is really asserting the
    // page renders exactly what it's given rather than merging in anything
    // else - the filtering itself is the backend's job (see
    // test_batches_filtered_by_institute_code).
    getBatches.mockResolvedValue([makeBatch(14, "1315", "University of Chester")]);
    render(<UploadSummaryPage />);

    await screen.findByRole("cell", { name: "14" });
    expect(screen.queryByText("Canterbury Christ Church University")).not.toBeInTheDocument();
  });
});
