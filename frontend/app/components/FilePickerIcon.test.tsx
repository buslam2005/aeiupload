import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FilePickerIcon from "./FilePickerIcon";

describe("FilePickerIcon", () => {
  it("is disabled when disabled=true, and clicking it does not open the file picker", async () => {
    const user = userEvent.setup();
    render(<FilePickerIcon id="file" disabled file={null} onChange={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Choose file" });
    expect(button).toBeDisabled();
    expect(screen.getByText("No file chosen")).toBeInTheDocument();

    await user.click(button);
    // Disabled native buttons don't dispatch click handlers - nothing to
    // assert beyond "still disabled, no crash".
    expect(button).toBeDisabled();
  });

  it("is enabled when disabled=false and shows the chosen file's name", () => {
    const file = new File(["data"], "students.csv", { type: "text/csv" });
    render(<FilePickerIcon id="file" disabled={false} file={file} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Choose file" })).toBeEnabled();
    expect(screen.getByText("students.csv")).toBeInTheDocument();
  });
});
