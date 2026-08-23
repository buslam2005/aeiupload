import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadOriginalPathPage from "./page";
import type { Institute, ProgrammeChoice } from "../lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("institute_code=1315&institute_name=University+of+Chester"),
}));

const getInstitutes = vi.fn();
const getProgrammes = vi.fn();
const uploadOriginalPath = vi.fn();
vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    getInstitutes: () => getInstitutes(),
    getProgrammes: (code: string) => getProgrammes(code),
    uploadOriginalPath: (params: unknown) => uploadOriginalPath(params),
  };
});

const INSTITUTES: Institute[] = [{ code: "1315", name: "University of Chester" }];
const PROGRAMME_CHOICES: ProgrammeChoice[] = [];

afterEach(() => {
  vi.clearAllMocks();
});

function chooseFile(container: HTMLElement, name: string) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["data"], name, { type: "text/csv" });
  return userEvent.upload(input, file);
}

describe("UploadOriginalPathPage - upload error handling", () => {
  it("shows the backend's error message underneath the file icon when the upload fails", async () => {
    getInstitutes.mockResolvedValue(INSTITUTES);
    getProgrammes.mockResolvedValue(PROGRAMME_CHOICES);
    uploadOriginalPath.mockRejectedValue(
      new Error("Column header(s) are wrong. Please check the file before upload it again.")
    );
    const user = userEvent.setup();
    const { container } = render(<UploadOriginalPathPage />);

    await chooseFile(container, "wrong_headers.csv");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText("Column header(s) are wrong. Please check the file before upload it again.")
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("clears the error once a new file is chosen", async () => {
    getInstitutes.mockResolvedValue(INSTITUTES);
    getProgrammes.mockResolvedValue(PROGRAMME_CHOICES);
    uploadOriginalPath.mockRejectedValue(
      new Error("There is no student record in the file. Please check the file before upload it again.")
    );
    const user = userEvent.setup();
    const { container } = render(<UploadOriginalPathPage />);

    await chooseFile(container, "header_only.csv");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    expect(await screen.findByText(/There is no student record/)).toBeInTheDocument();

    await chooseFile(container, "retry.csv");
    expect(screen.queryByText(/There is no student record/)).not.toBeInTheDocument();
  });

  it("navigates to Upload Result on a successful upload, without showing an error", async () => {
    getInstitutes.mockResolvedValue(INSTITUTES);
    getProgrammes.mockResolvedValue(PROGRAMME_CHOICES);
    uploadOriginalPath.mockResolvedValue({ nmc_uploadbatchid: 42 });
    const user = userEvent.setup();
    const { container } = render(<UploadOriginalPathPage />);

    await chooseFile(container, "valid.csv");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(push).toHaveBeenCalledWith("/upload-result?batchId=42");
  });
});
