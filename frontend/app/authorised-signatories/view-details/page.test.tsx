import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ViewDetailsPage from "./page";

let pin = "26H0401Z";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(`pin=${pin}`),
}));

describe("ViewDetailsPage", () => {
  it("renders static fields and hides Remove on the sole remaining course", () => {
    pin = "26H0401Z";
    render(<ViewDetailsPage />);

    expect(screen.getByText("26H0401Z")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "AN1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("shows a working Remove on an applicant with more than one course, and writes a fresh course via Add Courses", async () => {
    pin = "26H0499Z";
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    // Sai P has 2 courses to start - Remove is available.
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Add Courses" }));
    await user.click(screen.getByRole("checkbox", { name: /Community Practitioner.*Full Time/ }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("cell", { name: "P2" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(3);
  });

  it("disables Add Courses once all 5 slots are full", async () => {
    pin = "26H0499Z";
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    const remainingChoices = [/Community Practitioner.*Full Time/, /Community Practitioner.*Part Time/, /Adult.*Apprenticeship/];
    for (const choiceName of remainingChoices) {
      await user.click(screen.getByRole("button", { name: "Add Courses" }));
      await user.click(screen.getByRole("checkbox", { name: choiceName }));
      await user.click(screen.getByRole("button", { name: "Add" }));
    }

    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 course rows
    expect(screen.getByRole("button", { name: "Add Courses" })).toBeDisabled();
  });
});
