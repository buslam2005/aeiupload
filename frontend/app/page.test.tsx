import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import FirstPage from "./page";
import type { Institute } from "./lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const INSTITUTES: Institute[] = [
  { code: "1315", name: "University of Chester" },
  { code: "8020", name: "Canterbury Christ Church University" },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FirstPage", () => {
  it("disables Continue until an institute is selected, then navigates with its code and name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => INSTITUTES })
    );
    const user = userEvent.setup();
    render(<FirstPage />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await screen.findByRole("option", { name: /University of Chester/ });
    await user.selectOptions(screen.getByLabelText(/select a higher education institute/i), "1315");
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(push).toHaveBeenCalledWith(
      "/upload-summary?institute_code=1315&institute_name=University+of+Chester"
    );
  });
});
