import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CourseSubgrid from "./CourseSubgrid";
import type { CourseRow } from "../lib/types";

function makeCourse(slot: number): CourseRow {
  return {
    slot,
    nmc_trainingtypecode: "R",
    nmc_programmecode: `P${slot}`,
    nmc_academiclevel: "B Nurs (Hons)",
    nmc_qualificationroute: "F",
    nmc_institutename: "University of Chester",
    nmc_aeiprogrammetitle: `Programme ${slot}`,
  };
}

describe("CourseSubgrid", () => {
  it("scrolls rather than truncates when given more than 5 rows", () => {
    const courses = [1, 2, 3, 4, 5, 6, 7].map(makeCourse);
    render(<CourseSubgrid courses={courses} onRemove={vi.fn()} />);

    // All 7 rows are still in the DOM - the cap is a scrollable max-height,
    // not a slice of the data.
    for (const course of courses) {
      expect(screen.getByRole("cell", { name: course.nmc_aeiprogrammetitle! })).toBeInTheDocument();
    }
    const scrollContainer = screen.getByRole("table").parentElement;
    expect(scrollContainer).toHaveClass("overflow-y-auto");
  });
});
