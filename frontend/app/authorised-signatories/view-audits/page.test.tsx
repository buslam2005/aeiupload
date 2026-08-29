import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ViewAuditsPage from "./page";
import type { AuditRecordEntry } from "../../lib/types";

let pin = "26H0499Z";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(`pin=${pin}`),
}));

const getSignatoryAudit = vi.fn();
vi.mock("../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api")>("../../lib/api");
  return {
    ...actual,
    getSignatoryAudit: (p: string) => getSignatoryAudit(p),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

// 7 rows, newest first (the real backend sorts server-side; this fixture is
// pre-sorted the same way so the test only exercises pagination, not sorting).
function saiAudits(): AuditRecordEntry[] {
  const base = {
    nmc_pin: "26H0499Z",
    nmc_lastname: "P",
    nmc_firstname: "Sai",
    nmc_attributechanged: "Approved Course",
    nmc_addedby: "User1",
  };
  return [
    { ...base, id: 7, nmc_modifiedon: "2026-08-20T11:46:00+00:00", nmc_previousvalue: "", nmc_newvalue: "RSC1" },
    { ...base, id: 6, nmc_modifiedon: "2026-07-22T17:47:00+00:00", nmc_previousvalue: "RF2", nmc_newvalue: "" },
    { ...base, id: 5, nmc_modifiedon: "2026-07-21T11:50:00+00:00", nmc_previousvalue: "", nmc_newvalue: "RF2" },
    { ...base, id: 4, nmc_modifiedon: "2026-06-16T12:57:00+00:00", nmc_previousvalue: "", nmc_newvalue: "SDF3" },
    { ...base, id: 3, nmc_modifiedon: "2026-06-16T11:45:00+00:00", nmc_previousvalue: "SDF3", nmc_newvalue: "" },
    { ...base, id: 2, nmc_modifiedon: "2026-05-23T11:58:00+00:00", nmc_previousvalue: "", nmc_newvalue: "SDF3" },
    { ...base, id: 1, nmc_modifiedon: "2026-05-09T17:17:00+00:00", nmc_previousvalue: "", nmc_newvalue: "RAN" },
  ];
}

describe("ViewAuditsPage", () => {
  it("shows the newest entry first, with genuinely different Old/New values", async () => {
    pin = "26H0499Z";
    getSignatoryAudit.mockResolvedValue(saiAudits());
    render(<ViewAuditsPage />);

    // newest (2026-08-20) is the RSC1 add - previousvalue blank, newvalue RSC1
    expect(await screen.findByRole("cell", { name: "RSC1" })).toBeInTheDocument();
    // header + 5 (page size) of Sai P's 7 audit rows
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });

  it("paginates to a second page for a pin with more than one page of audit rows", async () => {
    pin = "26H0499Z";
    getSignatoryAudit.mockResolvedValue(saiAudits());
    const user = userEvent.setup();
    render(<ViewAuditsPage />);

    await screen.findByRole("cell", { name: "RSC1" });
    expect(screen.queryByText("RAN")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "2" }));
    expect(screen.getByRole("cell", { name: "RAN" })).toBeInTheDocument();
  });

  it("shows an empty state for a pin with no audit history", async () => {
    pin = "26H0402Z";
    getSignatoryAudit.mockResolvedValue([]);
    render(<ViewAuditsPage />);
    expect(await screen.findByText("There are no audit records to display.")).toBeInTheDocument();
  });
});
