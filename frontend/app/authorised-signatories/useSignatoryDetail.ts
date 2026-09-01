"use client";

import { useEffect, useState } from "react";
import { addCourse as apiAddCourse, getCourseChoices, getSignatory, removeCourse as apiRemoveCourse } from "../lib/api";
import type { CourseChoice, SignatoryDetail } from "../lib/types";

// Shared by View Details and Add Signatory step 2 - both need the same
// applicant fetch, the same institute-scoped course-choices fetch, and the
// same add-course behaviour (View Details additionally uses removeCourse).
export function useSignatoryDetail(pin: string) {
  const [detail, setDetail] = useState<SignatoryDetail | null | undefined>(undefined);
  const [choices, setChoices] = useState<CourseChoice[]>([]);

  useEffect(() => {
    getSignatory(pin)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [pin]);

  const instituteCode = detail?.nmc_institutecode;
  useEffect(() => {
    if (instituteCode) {
      getCourseChoices(instituteCode).then(setChoices);
    }
  }, [instituteCode]);

  // Adds each choice in turn - the Course Lookup pop-up allows selecting up
  // to 3 at once, but the backend endpoint takes one course per call. Each
  // call commits server-side, so a failure partway through (e.g. capacity)
  // still leaves the earlier successful adds in place and reflected here.
  async function addCourses(choicesToAdd: CourseChoice[]) {
    for (const choice of choicesToAdd) {
      setDetail(await apiAddCourse(pin, choice));
    }
  }

  async function removeCourse(slot: number) {
    setDetail(await apiRemoveCourse(pin, slot));
  }

  return { detail, choices, addCourses, removeCourse };
}
