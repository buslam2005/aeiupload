// Shared class strings so <button> and <Link> elements can look identical -
// the diagrams use the same purple/magenta square-ish button style everywhere
// (Change, Upload File, Back, Next, Same course/Multiple courses, Submit,
// Resubmit, Back to Upload Summary).

const base =
  "inline-flex items-center justify-center rounded px-5 py-2 font-semibold transition-colors";

export const primaryButtonClass = `${base} bg-brand-accent text-white hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:bg-brand-disabled-bg disabled:text-brand-disabled-text`;

export const disabledButtonClass = `${base} cursor-not-allowed bg-brand-disabled-bg text-brand-disabled-text`;
