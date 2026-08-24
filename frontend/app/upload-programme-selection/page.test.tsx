import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadProgrammeSelectionPage from "./page";
import type { ProgrammeTitleChoice } from "../lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("institute_code=1315&institute_name=University+of+Chester"),
}));

const getProgrammeTitles = vi.fn();
const uploadAlternatePath = vi.fn();
vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    getProgrammeTitles: (code: string) => getProgrammeTitles(code),
    uploadAlternatePath: (params: unknown) => uploadAlternatePath(params),
  };
});

const PROGRAMME_TITLE_CHOICES: ProgrammeTitleChoice[] = [
  {
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "6",
    nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing",
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

function chooseFile(container: HTMLElement, name: string) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["data"], name, { type: "text/csv" });
  return userEvent.upload(input, file);
}

async function selectProgramme(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("HEI Programme"), "BN (Hons) Children's Nursing");
}

describe("UploadProgrammeSelectionPage - upload error handling", () => {
  it("shows the backend's error message underneath the file icon when the upload fails", async () => {
    getProgrammeTitles.mockResolvedValue(PROGRAMME_TITLE_CHOICES);
    uploadAlternatePath.mockRejectedValue(
      new Error("Portal fails to recognize the file. Please check the file before upload it again.")
    );
    const user = userEvent.setup();
    const { container } = render(<UploadProgrammeSelectionPage />);

    await screen.findByRole("option", { name: "BN (Hons) Children's Nursing" });
    await selectProgramme(user);
    await chooseFile(container, "corrupted.xlsx");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText("Portal fails to recognize the file. Please check the file before upload it again.")
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("clears the error once a new file is chosen", async () => {
    getProgrammeTitles.mockResolvedValue(PROGRAMME_TITLE_CHOICES);
    uploadAlternatePath.mockRejectedValue(
      new Error("Column header(s) are wrong. Please check the file before upload it again.")
    );
    const user = userEvent.setup();
    const { container } = render(<UploadProgrammeSelectionPage />);

    await screen.findByRole("option", { name: "BN (Hons) Children's Nursing" });
    await selectProgramme(user);
    await chooseFile(container, "wrong_headers.csv");
    await user.click(screen.getByRole("button", { name: "Upload" }));
    expect(await screen.findByText(/Column header\(s\) are wrong/)).toBeInTheDocument();

    await chooseFile(container, "retry.csv");
    expect(screen.queryByText(/Column header\(s\) are wrong/)).not.toBeInTheDocument();
  });

  it("navigates to Upload Result on a successful upload, without showing an error", async () => {
    getProgrammeTitles.mockResolvedValue(PROGRAMME_TITLE_CHOICES);
    uploadAlternatePath.mockResolvedValue({ nmc_uploadbatchid: 7 });
    const user = userEvent.setup();
    const { container } = render(<UploadProgrammeSelectionPage />);

    await screen.findByRole("option", { name: "BN (Hons) Children's Nursing" });
    await selectProgramme(user);
    await chooseFile(container, "valid.csv");
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(push).toHaveBeenCalledWith("/upload-result?batchId=7");
  });
});
