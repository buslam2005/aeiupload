"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../../components/PageShell";
import SignatoryStaticFields from "../../components/SignatoryStaticFields";
import CourseSubgrid from "../../components/CourseSubgrid";
import CourseLookupModal from "../../components/CourseLookupModal";
import { disabledButtonClass, primaryButtonClass } from "../../components/buttonStyles";
import { MOCK_COURSE_CHOICES, MOCK_SIGNATORY_DETAILS, courseFromChoice, firstEmptyAddSlot } from "../mockData";
import type { CourseChoice, SignatoryDetail } from "../../lib/types";

function ViewDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") ?? "";

  const [detail, setDetail] = useState<SignatoryDetail | null | undefined>(() => MOCK_SIGNATORY_DETAILS[pin] ?? null);
  const [modalOpen, setModalOpen] = useState(false);

  if (detail === undefined) {
    return (
      <PageShell>
        <p>Loading...</p>
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell>
        <p>Signatory not found.</p>
      </PageShell>
    );
  }

  function handleAddCourse(choice: CourseChoice) {
    setDetail((prev) => {
      if (!prev) return prev;
      const slot = firstEmptyAddSlot(prev.courses);
      if (slot === null) return prev;
      return { ...prev, courses: [...prev.courses, courseFromChoice(slot, prev.nmc_institutename, choice)] };
    });
  }

  function handleRemoveCourse(slot: number) {
    setDetail((prev) => (prev ? { ...prev, courses: prev.courses.filter((c) => c.slot !== slot) } : prev));
  }

  const atCapacity = detail.courses.length >= 5;

  return (
    <PageShell>
      <SignatoryStaticFields detail={detail} />

      <div className="mt-6 mb-3 flex items-center gap-4">
        <h2 className="font-bold">Courses</h2>
        <button
          type="button"
          className={atCapacity ? disabledButtonClass : primaryButtonClass}
          disabled={atCapacity}
          onClick={() => setModalOpen(true)}
        >
          Add Courses
        </button>
      </div>

      <CourseSubgrid courses={detail.courses} onRemove={handleRemoveCourse} />

      <div className="mt-6">
        <button type="button" className={primaryButtonClass} onClick={() => router.back()}>
          Previous
        </button>
      </div>

      <CourseLookupModal
        open={modalOpen}
        choices={MOCK_COURSE_CHOICES}
        onAdd={handleAddCourse}
        onClose={() => setModalOpen(false)}
      />
    </PageShell>
  );
}

export default function ViewDetailsPage() {
  return (
    <Suspense>
      <ViewDetailsContent />
    </Suspense>
  );
}
