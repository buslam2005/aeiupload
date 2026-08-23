interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ViewDetailsField({ label, value, onChange, error, required }: Props) {
  const id = `field-${slugify(label)}`;
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
        {required && " *"}
      </label>
      <input
        id={id}
        type="text"
        className="w-full max-w-md rounded border border-brand-border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-sm text-brand-error">{error}</p>}
    </div>
  );
}
