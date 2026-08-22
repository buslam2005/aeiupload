// Small inline SVGs so the app doesn't need an icon library dependency for a
// handful of glyphs. Deliberately generic/abstract shapes rather than
// reproductions of any real brand's marks (relevant for the footer's
// decorative "social" icons).

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <line x1="18" y1="18" x2="13.5" y2="13.5" strokeLinecap="round" />
    </svg>
  );
}

export function UploadFileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path d="M10 13V3" strokeLinecap="round" />
      <path d="M6 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DECORATIVE_GLYPHS = [
  <circle key="1" cx="10" cy="10" r="5" />,
  <rect key="2" x="6" y="6" width="8" height="8" rx="1.5" />,
  <path key="3" d="M10 5l4 8H6z" strokeLinejoin="round" />,
  <path key="4" d="M6 10a4 4 0 1 1 8 0 4 4 0 0 1-8 0" strokeDasharray="2 2" />,
];

export function DecorativeIcon({ index, className }: { index: number; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      {DECORATIVE_GLYPHS[index % DECORATIVE_GLYPHS.length]}
    </svg>
  );
}
