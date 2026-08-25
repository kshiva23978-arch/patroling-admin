export const inputClass =
  "block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

export const labelClass = "block text-sm font-medium text-zinc-700";

export const helpTextClass = "text-xs text-zinc-500";

export const errorTextClass = "text-xs text-red-600";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

export const linkButtonClass =
  "inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50";

export const cardClass =
  "rounded-lg border border-zinc-200 bg-white shadow-sm";

export const badgeClass = (active: boolean) =>
  active
    ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
    : "inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600";
