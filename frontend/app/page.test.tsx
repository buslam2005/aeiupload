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

  it("renders the other tiles without a destination", () => {
    render(<LandingPage />);
    expect(screen.getByText("Manage approved signatories").closest("a")).toBeNull();
    expect(screen.getByText("DGHC Requests").closest("a")).toBeNull();
  });
});
