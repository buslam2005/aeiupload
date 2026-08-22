export default function GuidanceBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-brand-border bg-brand-info-bg p-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}
