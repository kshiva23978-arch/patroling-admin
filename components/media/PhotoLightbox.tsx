"use client";

import { useEffect, useState } from "react";

export interface LightboxPhoto {
  id: string;
  caption?: string | null;
}

/** Fullscreen viewer for a photo grid's images — Escape to close, arrow keys
 * or the on-screen buttons to step between the grid's other photos. */
function Lightbox({
  items,
  baseUrl,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxPhoto[];
  baseUrl: string;
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") onNavigate((index + 1) % items.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, items.length, onClose, onNavigate]);

  const current = items[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <CloseIcon />
      </button>

      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + items.length) % items.length);
          }}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <div
        className="flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- proxied, authenticated backend image */}
        <img
          src={`${baseUrl}/${current.id}`}
          alt={current.caption ?? ""}
          className="max-h-[80vh] max-w-full rounded-md object-contain"
        />
        {current.caption && (
          <p className="max-w-md text-center text-sm text-white/90">{current.caption}</p>
        )}
      </div>

      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % items.length);
          }}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <ChevronIcon direction="right" />
        </button>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
          {index + 1} / {items.length}
        </div>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Thumbnail grid of photos proxied through an authenticated backend route
 * (`{baseUrl}/{id}` — e.g. `/api/case-media`, `/api/activity-media`).
 * Clicking any thumbnail opens the shared [Lightbox] for the full set, with
 * captions shown when the photo has one.
 */
export function PhotoGrid({
  items,
  baseUrl,
  emptyMessage = "No photos.",
}: {
  items: LightboxPhoto[];
  baseUrl: string;
  emptyMessage?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className="text-xs text-zinc-400">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- proxied, authenticated backend image
        <img
          key={item.id}
          src={`${baseUrl}/${item.id}`}
          alt={item.caption ?? ""}
          onClick={() => setOpenIndex(index)}
          className="h-20 w-20 cursor-pointer rounded-md border border-zinc-200 object-cover transition hover:opacity-80"
        />
      ))}
      {openIndex !== null && (
        <Lightbox
          items={items}
          baseUrl={baseUrl}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
}
