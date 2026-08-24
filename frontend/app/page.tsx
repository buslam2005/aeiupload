import Link from "next/link";
import PageShell from "./components/PageShell";
import { ArrowRightIcon } from "./components/icons";

// AEIportallandingpage.png - only the "Upload student records" tile has a
// destination; the rest are non-functional placeholders for this prototype.
const TILES: { label: string; href?: string }[] = [
  { label: "Upload student records", href: "/select-institute" },
  { label: "Manage approved signatories" },
  { label: "Request PINs" },
  { label: "Manage OSCE results" },
  { label: "Manage your team" },
  { label: "DGHC Requests" },
];

function TileContent({ label }: { label: string }) {
  return (
    <>
      <span>{label}</span>
      <ArrowRightIcon className="h-6 w-6 shrink-0 text-white" />
    </>
  );
}

export default function LandingPage() {
  const tileClass =
    "flex h-32 w-40 flex-col items-start justify-between rounded bg-brand-accent p-3 text-left font-semibold text-white";

  return (
    <PageShell>
      <h1 className="mb-2 text-xl font-bold">Welcome to the AEI Portal</h1>
      <p className="mb-8 text-sm">
        Please contact us if you have any questions.
      </p>

      <div className="flex flex-wrap gap-4">
        {TILES.map((tile) =>
          tile.href ? (
            <Link key={tile.label} href={tile.href} className={`${tileClass} transition-colors hover:bg-brand-accent-hover`}>
              <TileContent label={tile.label} />
            </Link>
          ) : (
            <div key={tile.label} className={tileClass}>
              <TileContent label={tile.label} />
            </div>
          )
        )}
      </div>
    </PageShell>
  );
}
