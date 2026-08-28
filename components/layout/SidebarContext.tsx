"use client";

import { createContext, useContext, useState } from "react";

interface SidebarContextValue {
  /** Mobile off-canvas drawer — only touched by explicit user action (the toggle button, the backdrop, or tapping a nav link), never automatically. */
  mobileOpen: boolean;
  /** Desktop inline collapse — only touched by the toggle button; navigating never changes it. */
  collapsed: boolean;
  /** Toggles whichever of the two applies at the current viewport width. */
  toggle: () => void;
  /** Closes the mobile drawer only — used by the backdrop and nav-link taps, so it never touches the desktop collapse state. */
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Two independent flags, each changed only by a deliberate user action —
 * no effect anywhere flips either one automatically (not on navigation,
 * not on resize, not on mount). `mobileOpen` starts closed (a drawer
 * shouldn't cover the screen on load) and `collapsed` starts open (a
 * desktop admin panel should show its nav by default); both are plain
 * component state from then on, so once you open it it stays open, and
 * once you close it it stays closed, until you toggle it yourself.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  return (
    <SidebarContext.Provider
      value={{ mobileOpen, collapsed, toggle, closeMobile: () => setMobileOpen(false) }}
    >
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
