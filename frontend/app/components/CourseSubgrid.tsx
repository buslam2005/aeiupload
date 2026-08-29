import type { CourseRow } from "../lib/types";

// Course subgrid shared by View Details and Add Signatory step 2
// (AuthorisedSignatoriesFirstPage_ViewDetails.png / ..._AddCourse.png).
// Remove is omitted entirely when onRemove isn't passed - Add Signatory step
// 2 is add-only, per developmentplan_AS.md ("no remove control anywhere").
// There's no "Edit" action: the diagram's per-row control is a generic
// chevron, UI_requirements.md's "link to Edit Course page" just reopens the
// same Course Lookup pop-up Add Courses uses, and the backend has no
// edit-in-place endpoint (only add-to-next-slot / remove-a-slot) - so Remove
// is the only real action to wire here.
interface Props {
  courses: CourseRow[];
  onRemove?: (slot: number) => void;
}

export default function CourseSubgrid({ courses, onRemove }: Props) {
  return (
    // At most 5 rows visible, infinite vertical scroll beyond that (in
    // practice the 5-slot cap means this rarely triggers, but it's here for
    // when it does).
    <div className="max-h-64 overflow-y-auto overflow-x-auto rounded border border-brand-border">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-brand-border text-left">
            <th className="py-2 pr-4">Education Institution</th>
            <th className="py-2 pr-4">AEI Programme Title</th>
            <th className="py-2 pr-4">Training Type Code</th>
            <th className="py-2 pr-4">Programme Code</th>
            <th className="py-2 pr-4">Academic Level</th>
            <th className="py-2 pr-4">Qualification Route</th>
            {onRemove && <th className="py-2 pr-4" />}
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.slot} className="border-b border-brand-border">
              <td className="py-2 pr-4">{course.nmc_institutename}</td>
              <td className="py-2 pr-4">{course.nmc_aeiprogrammetitle ?? "-"}</td>
              <td className="py-2 pr-4">{course.nmc_trainingtypecode}</td>
              <td className="py-2 pr-4">{course.nmc_programmecode}</td>
              <td className="py-2 pr-4">{course.nmc_academiclevel}</td>
              <td className="py-2 pr-4">{course.nmc_qualificationroute}</td>
              {onRemove && (
                <td className="py-2 pr-4">
                  {courses.length > 1 && (
                    <button
                      type="button"
                      className="text-brand-error underline"
                      onClick={() => onRemove(course.slot)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {courses.length === 0 && (
            <tr>
              <td colSpan={onRemove ? 7 : 6} className="py-4 text-center text-brand-disabled-text">
                There are no courses to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
