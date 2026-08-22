interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export default function ViewDetailsField({ label, value, onChange, error, required }: Props) {
  return (
    <div className="mb-5">
      <label className="mb-1 block font-medium">
        {label}
        {required && " *"}
      </label>
      <input
        type="text"
        className="w-full max-w-md rounded border border-brand-border px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1 text-sm text-brand-error">{error}</p>}
    </div>
  );
}
