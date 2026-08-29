import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddSignatoryPage from "./page";
import type { SignatoryDetail } from "../../lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const matchSignatory = vi.fn();
vi.mock("../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api")>("../../lib/api");
  return {
    ...actual,
    matchSignatory: (pin: string, lastname: string) => matchSignatory(pin, lastname),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

const DETAIL = { nmc_pin: "26H0401Z" } as SignatoryDetail;

describe("AddSignatoryPage", () => {
  it("navigates to the detail page on a valid active PIN + surname match", async () => {
    matchSignatory.mockResolvedValue(DETAIL);
    const user = userEvent.setup();
    render(<AddSignatoryPage />);

    await user.type(screen.getByLabelText("NMC PIN"), "26H0401Z");
    await user.type(screen.getByLabelText("Surname"), "Young");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(matchSignatory).toHaveBeenCalledWith("26H0401Z", "Young");
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/authorised-signatories/add-signatory/detail?pin=26H0401Z"));
  });

  it("shows an inline mismatch error and does not navigate on a wrong surname", async () => {
    matchSignatory.mockRejectedValue(new Error("404"));
    const user = userEvent.setup();
    render(<AddSignatoryPage />);

    await user.type(screen.getByLabelText("NMC PIN"), "26H0401Z");
    await user.type(screen.getByLabelText("Surname"), "WrongName");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText(/Please enter the registrant's PIN and Surname/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("treats an inactive PIN as no match even with the correct surname", async () => {
    matchSignatory.mockRejectedValue(new Error("404"));
    const user = userEvent.setup();
    render(<AddSignatoryPage />);

    await user.type(screen.getByLabelText("NMC PIN"), "26H0417Z");
    await user.type(screen.getByLabelText("Surname"), "Young");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText(/Please enter the registrant's PIN and Surname/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("returns to the First Page without matching", async () => {
    const user = userEvent.setup();
    render(<AddSignatoryPage />);
    await user.click(screen.getByRole("button", { name: "Return to Summary page" }));
    expect(push).toHaveBeenCalledWith("/authorised-signatories");
    expect(matchSignatory).not.toHaveBeenCalled();
  });
});
