"use client";

import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/lib/ui-classes";

export interface MultiSelectOption {
  value: string;
  label: string;
}

/**
 * A dropdown of checkboxes standing in for `<select multiple>`, which
 * renders as an awkward always-open list box and needs ctrl/cmd-click to
 * pick more than one. Closed, it reads like the sibling single-selects
 * ("All Beaches", "Wandoor", "3 beaches"); open, every option is a
 * checkbox row. Nothing selected means "all".
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  allLabel,
  noun,
  disabled,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Shown when nothing is selected, e.g. "All Beaches". */
  allLabel: string;
  /** Plural noun for the "N selected" summary, e.g. "beaches". */
  noun: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedSet = new Set(selected);
  const summary =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? allLabel)
        : `${selected.length} ${noun}`;

  const toggle = (value: string) => {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${inputClass} flex w-auto min-w-40 items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{summary}</span>
        <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 z-20 mt-1 max-h-64 w-64 overflow-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-zinc-500">No options</p>
          ) : (
            <>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="mb-1 w-full rounded px-2 py-1 text-left text-xs font-medium text-zinc-500 hover:bg-zinc-50"
                >
                  Clear selection
                </button>
              )}
              {options.map((o) => (
                <label
                  key={o.value}
                  role="option"
                  aria-selected={selectedSet.has(o.value)}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(o.value)}
                    onChange={() => toggle(o.value)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  />
                  <span className="truncate">{o.label}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
