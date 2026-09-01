import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CourseLookupModal from "./CourseLookupModal";
import type { CourseChoice } from "../lib/types";

const CHOICES: CourseChoice[] = [
  {
    nmc_programmename: "Pre-registration nursing - Adult",
    nmc_trainingtype: "R",
    nmc_programme: "AN1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename: "Pre-registration nursing - Child",
    nmc_trainingtype: "R",
    nmc_programme: "SC1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename: "Pre-registration nursing - Mental Health",
    nmc_trainingtype: "R",
    nmc_programme: "MH1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename: "Pre-registration nursing - Learning Disability",
    nmc_trainingtype: "R",
    nmc_programme: "LD1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
];

describe("CourseLookupModal", () => {
  it("renders nothing when closed", () => {
    render(<CourseLookupModal open={false} choices={CHOICES} onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole("heading", { name: "Lookup records" })).not.toBeInTheDocument();
  });

  it("is multi-select: checking multiple rows keeps all of them checked, and Add is disabled until at least one is checked", async () => {
    const user = userEvent.setup();
    render(<CourseLookupModal open choices={CHOICES} onAdd={vi.fn()} onClose={vi.fn()} />);

    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeDisabled();

    const adultBox = screen.getByRole("checkbox", { name: /Pre-registration nursing - Adult/ });
    const childBox = screen.getByRole("checkbox", { name: /Pre-registration nursing - Child/ });

    await user.click(adultBox);
    expect(adultBox).toBeChecked();
    expect(addButton).toBeEnabled();

    await user.click(childBox);
    expect(childBox).toBeChecked();
    expect(adultBox).toBeChecked();
  });

  it("caps selection at 3: a 4th row's checkbox is disabled, and unchecking one re-enables selection", async () => {
    const user = userEvent.setup();
    render(<CourseLookupModal open choices={CHOICES} onAdd={vi.fn()} onClose={vi.fn()} />);

    const adultBox = screen.getByRole("checkbox", { name: /Pre-registration nursing - Adult/ });
    const childBox = screen.getByRole("checkbox", { name: /Pre-registration nursing - Child/ });
    const mentalHealthBox = screen.getByRole("checkbox", { name: /Pre-registration nursing - Mental Health/ });
    const learningDisabilityBox = screen.getByRole("checkbox", {
      name: /Pre-registration nursing - Learning Disability/,
    });

    await user.click(adultBox);
    await user.click(childBox);
    await user.click(mentalHealthBox);
    expect(screen.getByText("3 of 3 selected")).toBeInTheDocument();
    expect(learningDisabilityBox).toBeDisabled();

    await user.click(adultBox);
    expect(adultBox).not.toBeChecked();
    expect(learningDisabilityBox).toBeEnabled();
  });

  it("calls onAdd with all checked choices and closes", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CourseLookupModal open choices={CHOICES} onAdd={onAdd} onClose={onClose} />);

    await user.click(screen.getByRole("checkbox", { name: /Pre-registration nursing - Adult/ }));
    await user.click(screen.getByRole("checkbox", { name: /Pre-registration nursing - Child/ }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith([CHOICES[0], CHOICES[1]]);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the backend's error message underneath the pagination and stays open when onAdd rejects", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("The selected course was already attained."));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CourseLookupModal open choices={CHOICES} onAdd={onAdd} onClose={onClose} />);

    await user.click(screen.getByRole("checkbox", { name: /Pre-registration nursing - Child/ }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("The selected course was already attained.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    // Modal stays open with the same choice still selectable/checked.
    expect(screen.getByRole("checkbox", { name: /Pre-registration nursing - Child/ })).toBeChecked();
  });

  it("Cancel closes without adding", async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CourseLookupModal open choices={CHOICES} onAdd={onAdd} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
