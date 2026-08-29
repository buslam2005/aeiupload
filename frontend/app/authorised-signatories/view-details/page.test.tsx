import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ViewDetailsPage from "./page";
import type { CourseChoice, SignatoryDetail } from "../../lib/types";

let pin = "26H0401Z";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(`pin=${pin}`),
}));

const COURSE_CHOICES: CourseChoice[] = [
  {
    nmc_programmename: "Community Practitioner Nurse Prescribing V150",
    nmc_trainingtype: "F",
    nmc_programme: "P2",
    nmc_academicroute: "Level 7",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
  {
    nmc_programmename: "Community Practitioner Nurse Prescribing V150",
    nmc_trainingtype: "F",
    nmc_programme: "P2",
    nmc_academicroute: "Level 7",
    nmc_qualificationlevel: "P",
    nmc_qualificationlevelname: "Part Time",
  },
  {
    nmc_programmename: "Pre-registration nursing - Adult",
    nmc_trainingtype: "R",
    nmc_programme: "AN1",
    nmc_academicroute: "B Nurs (Hons)",
    nmc_qualificationlevel: "A",
    nmc_qualificationlevelname: "Apprenticeship",
  },
];

const YOUNG_DETAIL: SignatoryDetail = {
  nmc_pin: "26H0401Z",
  nmc_lastname: "Young",
  nmc_firstname: "Mary 1",
  nmc_regexpirydate: "16/09/2027",
  nmc_addedby: "Rick Flair",
  nmc_createdon: "19/11/2025",
  nmc_institutecode: "1315",
  nmc_institutename: "University of Chester",
  nmc_active: "Yes",
  register_parts: ["Nursing"],
  practice_types: [],
  courses: [
    {
      slot: 1,
      nmc_trainingtypecode: "R",
      nmc_programmecode: "AN1",
      nmc_academiclevel: "B Nurs (Hons)",
      nmc_qualificationroute: "F",
      nmc_institutename: "University of Chester",
      nmc_aeiprogrammetitle: "BN (Hons) Adult Nursing",
    },
  ],
};

function saiDetail(): SignatoryDetail {
  return {
    nmc_pin: "26H0499Z",
    nmc_lastname: "P",
    nmc_firstname: "Sai",
    nmc_regexpirydate: "31/08/2026",
    nmc_addedby: "Sai NMC AEI Admin",
    nmc_createdon: "18/06/2025",
    nmc_institutecode: "1315",
    nmc_institutename: "University of Chester",
    nmc_active: "Yes",
    register_parts: ["Nursing", "Midwifery", "SCPHN"],
    practice_types: ["Nursing"],
    courses: [
      {
        slot: 1,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "AN",
        nmc_academiclevel: "BSc (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: "University of Chester",
        nmc_aeiprogrammetitle: null,
      },
      {
        slot: 2,
        nmc_trainingtypecode: "R",
        nmc_programmecode: "SC1",
        nmc_academiclevel: "B Nurs (Hons)",
        nmc_qualificationroute: "F",
        nmc_institutename: "University of Chester",
        nmc_aeiprogrammetitle: "BN (Hons) Children's Nursing",
      },
    ],
  };
}

const getSignatory = vi.fn();
const getCourseChoices = vi.fn();
const addCourse = vi.fn();
const removeCourse = vi.fn();
vi.mock("../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api")>("../../lib/api");
  return {
    ...actual,
    getSignatory: (p: string) => getSignatory(p),
    getCourseChoices: (code: string) => getCourseChoices(code),
    addCourse: (p: string, choice: CourseChoice) => addCourse(p, choice),
    removeCourse: (p: string, slot: number) => removeCourse(p, slot),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

/** Wires the mocked API to a mutable in-memory copy of `initial`, so
 * addCourse/removeCourse behave like the real backend (server-assigned next
 * slot, full detail returned) without a real server. */
function serveStateful(initial: SignatoryDetail) {
  let current = initial;
  getSignatory.mockImplementation(() => Promise.resolve(current));
  getCourseChoices.mockResolvedValue(COURSE_CHOICES);
  addCourse.mockImplementation((_p: string, choice: CourseChoice) => {
    const usedSlots = new Set(current.courses.map((c) => c.slot));
    const slot = [2, 3, 4, 5].find((s) => !usedSlots.has(s))!;
    current = {
      ...current,
      courses: [
        ...current.courses,
        {
          slot,
          nmc_trainingtypecode: choice.nmc_trainingtype,
          nmc_programmecode: choice.nmc_programme,
          nmc_academiclevel: choice.nmc_academicroute,
          nmc_qualificationroute: choice.nmc_qualificationlevel,
          nmc_institutename: current.nmc_institutename,
          nmc_aeiprogrammetitle: choice.nmc_programmename,
        },
      ],
    };
    return Promise.resolve(current);
  });
  removeCourse.mockImplementation((_p: string, slot: number) => {
    current = { ...current, courses: current.courses.filter((c) => c.slot !== slot) };
    return Promise.resolve(current);
  });
}

describe("ViewDetailsPage", () => {
  it("renders static fields and hides Remove on the sole remaining course", async () => {
    pin = "26H0401Z";
    serveStateful(YOUNG_DETAIL);
    render(<ViewDetailsPage />);

    expect(await screen.findByText("26H0401Z")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "AN1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("shows a working Remove on an applicant with more than one course, and writes a fresh course via Add Courses", async () => {
    pin = "26H0499Z";
    serveStateful(saiDetail());
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    // Sai P has 2 courses to start - Remove is available.
    expect(await screen.findAllByRole("button", { name: "Remove" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Add Courses" }));
    await user.click(await screen.findByRole("checkbox", { name: /Community Practitioner.*Full Time/ }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("cell", { name: "P2" })).toBeInTheDocument();
    expect(addCourse).toHaveBeenCalledWith("26H0499Z", COURSE_CHOICES[0]);
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(3);
  });

  it("removes a course and drops back to a hidden Remove control once only one is left", async () => {
    pin = "26H0401Z";
    const twoCourseYoung: SignatoryDetail = {
      ...YOUNG_DETAIL,
      courses: [
        ...YOUNG_DETAIL.courses,
        {
          slot: 2,
          nmc_trainingtypecode: "F",
          nmc_programmecode: "P2",
          nmc_academiclevel: "Level 7",
          nmc_qualificationroute: "F",
          nmc_institutename: "University of Chester",
          nmc_aeiprogrammetitle: "Community Practitioner Nurse Prescribing V150",
        },
      ],
    };
    serveStateful(twoCourseYoung);
    const user = userEvent.setup();
    render(<ViewDetailsPage />);

    const removeButtons = await screen.findAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[1]);

    expect(removeCourse).toHaveBeenCalledWith("26H0401Z", 2);
    await screen.findByText("26H0401Z");
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("disables Add Courses once all 5 slots are full", async () => {
    pin = "26H0499Z";
    serveStateful(saiDetail());
    const user = userEvent.setup();
    render(<ViewDetailsPage />);
    await screen.findAllByRole("button", { name: "Remove" });

    const remainingChoices = [/Community Practitioner.*Full Time/, /Community Practitioner.*Part Time/, /Adult.*Apprenticeship/];
    for (const choiceName of remainingChoices) {
      await user.click(screen.getByRole("button", { name: "Add Courses" }));
      await user.click(await screen.findByRole("checkbox", { name: choiceName }));
      await user.click(screen.getByRole("button", { name: "Add" }));
      await screen.findByRole("button", { name: "Add Courses" });
    }

    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 course rows
    expect(screen.getByRole("button", { name: "Add Courses" })).toBeDisabled();
  });
});
