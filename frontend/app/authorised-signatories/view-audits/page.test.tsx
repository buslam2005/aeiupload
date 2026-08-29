import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ViewAuditsPage from "./page";

let pin = "26H0499Z";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(`pin=${pin}`),
}));

describe("ViewAuditsPage", () => {
  it("shows the newest entry first, with genuinely different Old/New values", () => {
    pin = "26H0499Z";
    render(<ViewAuditsPage />);

    const rows = screen.getAllByRole("row");
    // header + 5 (page size) of Sai P's 7 audit rows
    expect(rows).toHaveLength(6);
    // newest (2026-08-20) is the RSC1 add - previousvalue blank, newvalue RSC1
    expect(screen.getByRole("cell", { name: "RSC1" })).toBeInTheDocument();
  });

  it("paginates to a second page for a pin with more than one page of audit rows", async () => {
    pin = "26H0499Z";
    const user = userEvent.setup();
    render(<ViewAuditsPage />);

    expect(screen.queryByText("RAN")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByRole("cell", { name: "RAN" })).toBeInTheDocument();
  });

  it("shows an empty state for a pin with no audit history", () => {
    pin = "26H0402Z";
    render(<ViewAuditsPage />);
    expect(screen.getByText("There are no audit records to display.")).toBeInTheDocument();
  });
});
