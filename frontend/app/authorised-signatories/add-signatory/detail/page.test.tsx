import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddSignatoryDetailPage from "./page";

let pin = "26H0401Z";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(`pin=${pin}`),
}));

describe("AddSignatoryDetailPage", () => {
  it("shows the inherited static fields and course subgrid with no Remove control", () => {
    pin = "26H0401Z";
    render(<AddSignatoryDetailPage />);

    expect(screen.getByText("26H0401Z")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "AN1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("grows the course subgrid when a course is added, still with no Remove control", async () => {
    pin = "26H0401Z";
    const user = userEvent.setup();
    render(<AddSignatoryDetailPage />);

    await user.click(screen.getByRole("button", { name: "Add Courses" }));
    await user.click(screen.getByRole("checkbox", { name: /Community Practitioner.*Full Time/ }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("cell", { name: "P2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
