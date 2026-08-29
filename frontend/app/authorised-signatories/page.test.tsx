import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthorisedSignatoriesPage from "./page";
import type { SignatoryListItem } from "../lib/types";

const getSignatories = vi.fn();
vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    getSignatories: (active: "Yes" | "No") => getSignatories(active),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeSignatory(overrides: Partial<SignatoryListItem>): SignatoryListItem {
  return {
    nmc_pin: "26H0401Z",
    nmc_lastname: "Young",
    nmc_firstname: "Mary 1",
    approved_course_title: "RAN1",
    register_parts: ["Nursing"],
    practice_types: [],
    nmc_regexpirydate: "16/09/2027",
    nmc_createdon: "19/11/2025",
    nmc_addedby: "Rick Flair",
    nmc_active: "Yes",
    ...overrides,
  };
}

const ACTIVE_ROW = makeSignatory({});
const INACTIVE_ROW = makeSignatory({
  nmc_pin: "26H0417Z",
  nmc_firstname: "Mary 17",
  nmc_active: "No",
});

function mockRows() {
  getSignatories.mockImplementation((active: "Yes" | "No") =>
    Promise.resolve(active === "Yes" ? [ACTIVE_ROW] : [INACTIVE_ROW])
  );
}

describe("AuthorisedSignatoriesPage", () => {
  it("fetches Active Signatories by default, with Remove Signatory available per row", async () => {
    mockRows();
    render(<AuthorisedSignatoriesPage />);

    expect(await screen.findByRole("cell", { name: /Mary 1 Young/ })).toBeInTheDocument();
    expect(getSignatories).toHaveBeenCalledWith("Yes");

    const user = userEvent.setup();
    const row = screen.getByRole("cell", { name: /Mary 1 Young/ }).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /Actions for/ }));
    expect(within(row).getByText("Remove Signatory")).toBeInTheDocument();
  });

  it("flips to Inactive Signatories, re-fetches, and hides Remove Signatory for those rows", async () => {
    mockRows();
    const user = userEvent.setup();
    render(<AuthorisedSignatoriesPage />);
    await screen.findByRole("cell", { name: /Mary 1 Young/ });

    await user.selectOptions(screen.getByLabelText(/Active or Inactive Signatories/), "Inactive");

    expect(await screen.findByRole("cell", { name: /Mary 17 Young/ })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: /Mary 1 Young/ })).not.toBeInTheDocument();
    expect(getSignatories).toHaveBeenCalledWith("No");

    const row = screen.getByRole("cell", { name: /Mary 17 Young/ }).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /Actions for/ }));
    expect(within(row).getByRole("link", { name: "View Details" })).toBeInTheDocument();
    expect(within(row).queryByText("Remove Signatory")).not.toBeInTheDocument();
  });

  it("links View Details and View Audits to the right pin", async () => {
    mockRows();
    const user = userEvent.setup();
    render(<AuthorisedSignatoriesPage />);

    const row = (await screen.findByRole("cell", { name: /Mary 1 Young/ })).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /Actions for/ }));
    expect(within(row).getByRole("link", { name: "View Details" })).toHaveAttribute(
      "href",
      "/authorised-signatories/view-details?pin=26H0401Z"
    );
    expect(within(row).getByRole("link", { name: "View Audits" })).toHaveAttribute(
      "href",
      "/authorised-signatories/view-audits?pin=26H0401Z"
    );
  });

  it("links Add new signatory to the Add Signatory flow", () => {
    mockRows();
    render(<AuthorisedSignatoriesPage />);
    expect(screen.getByRole("link", { name: "Add new signatory" })).toHaveAttribute(
      "href",
      "/authorised-signatories/add-signatory"
    );
  });

  it("wraps the subgrid in a scrollable container rather than paginating", async () => {
    mockRows();
    render(<AuthorisedSignatoriesPage />);
    await screen.findByRole("cell", { name: /Mary 1 Young/ });

    const scrollContainer = screen.getByRole("table").parentElement;
    expect(scrollContainer).toHaveClass("overflow-y-auto");
  });
});
