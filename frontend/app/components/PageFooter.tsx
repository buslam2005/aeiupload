import { DecorativeIcon } from "./icons";

// Static, de-branded approximation of requirement_doc/diagrams/PageFooter.png -
// text only, no links (every item below is plain text, not an <a>), per the
// amendment: "Just show static text in white and in different sizes and
// icons. No link." Three literal substitutions requested: "The Nursing and
// Midwifery Council 2026" -> "The UK Health Council", "The NMC" -> "The UKN",
// "867,000" -> "867" (and the diagram's "- Learn more" dropped along with it,
// since a "Learn more" phrase implies a link this footer isn't meant to have).

const COLUMNS: { heading: string; items: string[] }[] = [
  {
    heading: "Popular links",
    items: ["Registration", "Concerns", "Standards", "Education", "Careers", "About us"],
  },
  {
    heading: "More about",
    items: [
      "Environmental Sustainability Plan",
      "Publication scheme",
      "Privacy notice",
      "FOI and Data Protection requests",
      "Procurement",
      "Staff area and webmail",
    ],
  },
  {
    heading: "Stay updated",
    items: ["Latest News", "Newsletters"],
  },
];

const LEGAL_LINKS = ["Accessibility", "Cookies", "Modern slavery statement", "Terms & conditions"];

export default function PageFooter() {
  return (
    <footer className="bg-brand-header text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <p className="mb-8 text-xl font-semibold">
          We&apos;re the independent regulator of more than 867 nursing and midwifery professionals.
        </p>

        <div className="grid grid-cols-1 gap-8 border-t border-white/30 pt-6 sm:grid-cols-4">
          <div>
            <h3 className="mb-2 text-sm font-bold">Our values</h3>
            <p className="text-sm text-white/80">
              Our five values - Integrity, Fairness, Respect, Equity, and Effectiveness - reflect
              who we are and who we aspire to be.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-2 text-sm font-bold">{column.heading}</h3>
              <ul className="space-y-1 text-sm text-white/80">
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold">Follow us</h3>
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-header"
              >
                <DecorativeIcon index={i} className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-white/30 pt-4 text-xs text-white/70">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            {LEGAL_LINKS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p>
            © The UK Health Council. The UKN is a registered charity in England and Wales
            (1091434) and Scotland (SC038362)
          </p>
        </div>
      </div>
    </footer>
  );
}
