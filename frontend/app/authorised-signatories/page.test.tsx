import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AuthorisedSignatoriesPage from "./page";

describe("AuthorisedSignatoriesPage", () => {
  it("shows Active Signatories by default, with Remove Signatory available per row", async () => {
    render(<AuthorisedSignatoriesPage />);

    expect(screen.getByRole("cell", { name: /Mary 1 Young/ })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: /Mary 17 Young/ })).not.toBeInTheDocument();

    const user = userEvent.setup();
    const row = screen.getByRole("cell", { name: /Mary 1 Young/ }).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /Actions for/ }));
    expect(within(row).getByText("Remove Signatory")).toBeInTheDocument();
  });

  it("flips to Inactive Signatories and hides Remove Signatory for those rows", async () => {
    const user = userEvent.setup();
    render(<AuthorisedSignatoriesPage />);

    await user.selectOptions(screen.getByLabelText(/Active or Inactive Signatories/), "Inactive");

    expect(screen.getByRole("cell", { name: /Mary 17 Young/ })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: /Mary 1 Young/ })).not.toBeInTheDocument();

    const row = screen.getByRole("cell", { name: /Mary 17 Young/ }).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: /Actions for/ }));
    expect(within(row).getByRole("link", { name: "View Details" })).toBeInTheDocument();
    expect(within(row).queryByText("Remove Signatory")).not.toBeInTheDocument();
  });

  it("links View Details and View Audits to the right pin", async () => {
    const user = userEvent.setup();
    render(<AuthorisedSignatoriesPage />);

    const row = screen.getByRole("cell", { name: /Mary 1 Young/ }).closest("tr")!;
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
    render(<AuthorisedSignatoriesPage />);
    expect(screen.getByRole("link", { name: "Add new signatory" })).toHaveAttribute(
      "href",
      "/authorised-signatories/add-signatory"
    );
  });
});
