"use client";

import { useRef } from "react";
import { UploadFileIcon } from "./icons";

interface Props {
  id: string;
  disabled: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}

export default function FilePickerIcon({ id, disabled, file, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".csv,.xlsx"
        disabled={disabled}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label="Choose file"
        onClick={() => inputRef.current?.click()}
        className="rounded border border-brand-border p-2 text-brand-header enabled:hover:bg-brand-info-bg disabled:cursor-not-allowed disabled:border-brand-disabled-bg disabled:text-brand-disabled-text"
      >
        <UploadFileIcon className="h-6 w-6" />
      </button>
      <span className={disabled ? "text-brand-disabled-text" : ""}>
        {file ? file.name : "No file chosen"}
      </span>
    </div>
  );
}
