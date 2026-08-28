"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * One `open` flag drives both responsive behaviors of the sidebar: on
 * mobile it's an off-canvas drawer (`open` slides it in over the content,
 * with a backdrop), on desktop it's an inline collapse (`open` sets its
 * width back to normal, `false` shrinks it to 0 so the content area grows).
 * Defaults to `true` to match server-rendered markup exactly (avoids a
 * hydration mismatch); corrected to `false` right after mount on a narrow
 * viewport so a phone doesn't load with the drawer covering the screen.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setOpen(false);
    }
  }, []);

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
