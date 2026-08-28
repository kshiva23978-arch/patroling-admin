"use client";

import { useSidebar } from "./SidebarContext";

export function SidebarToggleButton() {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle sidebar"
      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      </svg>
    </button>
  );
}
