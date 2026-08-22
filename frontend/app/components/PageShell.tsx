import PageFooter from "./PageFooter";

// Shared header/footer across every page. Per requirements.md General Notes:
// no 'NMC' branding/logo (replaced with 'Prototype'), and no header/footer
// links - so the header is deliberately just a branded bar, and the footer
// (see PageFooter.tsx) is static text/icons only, nothing clickable in either.
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-brand-header">
        <div className="mx-auto w-full max-w-5xl px-6 py-4">
          <span className="text-xl font-bold tracking-wide text-white">Prototype</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      <PageFooter />
    </div>
  );
}
