// Register Part / Practice Type chip display (AuthorisedSignatoriesFirstPage_ViewDetails.png).
// Read-only for this prototype - UI_requirements.md's View Details section says
// these fields are "all static and not editable for demo purpose" - so the
// diagram's per-chip "x" is decorative only, not a working remove control.
export default function TagList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-brand-disabled-text">-</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-disabled-bg px-3 py-1 text-sm"
        >
          {value}
          <span aria-hidden="true" className="text-brand-accent">
            ×
          </span>
        </span>
      ))}
    </div>
  );
}
