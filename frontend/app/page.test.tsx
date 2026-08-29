import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "./page";

describe("LandingPage", () => {
  it("links the 'Upload student records' tile to the institute-selection page", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: /Upload student records/ })).toHaveAttribute(
      "href",
      "/select-institute"
    );
  });

  it("links the 'Manage approved signatories' tile to the Authorised Signatories module", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: /Manage approved signatories/ })).toHaveAttribute(
      "href",
      "/authorised-signatories"
    );
  });

  it("renders the remaining tiles without a destination", () => {
    render(<LandingPage />);
    expect(screen.getByText("DGHC Requests").closest("a")).toBeNull();
  });
});
