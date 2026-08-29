import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddSignatoryDetailPage from "./page";
import type { CourseChoice, SignatoryDetail } from "../../../lib/types";

let pin = "26H0401Z";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(`pin=${pin}`),
}));

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

const COURSE_CHOICES: CourseChoice[] = [
  {
    nmc_programmename: "Community Practitioner Nurse Prescribing V150",
    nmc_trainingtype: "F",
    nmc_programme: "P2",
    nmc_academicroute: "Level 7",
    nmc_qualificationlevel: "F",
    nmc_qualificationlevelname: "Full Time",
  },
];

const getSignatory = vi.fn();
const getCourseChoices = vi.fn();
const addCourse = vi.fn();
vi.mock("../../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/api")>("../../../lib/api");
  return {
    ...actual,
    getSignatory: (p: string) => getSignatory(p),
    getCourseChoices: (code: string) => getCourseChoices(code),
    addCourse: (p: string, choice: CourseChoice) => addCourse(p, choice),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AddSignatoryDetailPage", () => {
  it("shows the inherited static fields and course subgrid with no Remove control", async () => {
    pin = "26H0401Z";
    getSignatory.mockResolvedValue(YOUNG_DETAIL);
    getCourseChoices.mockResolvedValue(COURSE_CHOICES);
    render(<AddSignatoryDetailPage />);

    expect(await screen.findByText("26H0401Z")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "AN1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("grows the course subgrid when a course is added, still with no Remove control", async () => {
    pin = "26H0401Z";
    getSignatory.mockResolvedValue(YOUNG_DETAIL);
    getCourseChoices.mockResolvedValue(COURSE_CHOICES);
    addCourse.mockResolvedValue({
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
    });
    const user = userEvent.setup();
    render(<AddSignatoryDetailPage />);

    await user.click(await screen.findByRole("button", { name: "Add Courses" }));
    await user.click(await screen.findByRole("checkbox", { name: /Community Practitioner.*Full Time/ }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("cell", { name: "P2" })).toBeInTheDocument();
    expect(addCourse).toHaveBeenCalledWith("26H0401Z", COURSE_CHOICES[0]);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
