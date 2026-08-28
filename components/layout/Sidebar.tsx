"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasAdminPermission, type AdminPermissions } from "@/lib/permissions";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  href: string;
  label: string;
  /** Matches a backend `Roles::ADMIN_SECTIONS` key — gates visibility. */
  section: string;
  /**
   * Reserved for a Master Admin (System Administrator) regardless of
   * `permissions` — see backend `EnsureMasterAdmin`. Granting Roles/
   * Designations to a Department Admin/Ranger role would itself be a
   * privilege-escalation risk, so this can't be turned on by ticking a
   * permission checkbox.
   */
  masterOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", section: "dashboard" }],
  },
  {
    title: "Reference data",
    items: [
      { href: "/roles", label: "Roles", section: "roles", masterOnly: true },
      { href: "/designations", label: "Designations", section: "designations", masterOnly: true },
      { href: "/patrolling-modes", label: "Patrolling Modes", section: "patrolling_modes" },
      { href: "/patrol-types", label: "Patrol Types", section: "patrol_types" },
      { href: "/custom-fields", label: "Custom Fields", section: "custom_fields" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/patrollings", label: "Patrollings", section: "patrollings" },
      { href: "/case-entries", label: "Cases", section: "cases" },
      { href: "/activities", label: "Activities", section: "activities" },
      { href: "/ranges", label: "Ranges", section: "ranges" },
      { href: "/beats", label: "Beats", section: "beats" },
      { href: "/vehicles", label: "Vehicles", section: "vehicles" },
      { href: "/staff", label: "Staff", section: "staff" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admins", label: "Admins", section: "admins" },
      { href: "/users", label: "Field Users", section: "users" },
    ],
  },
];

export function Sidebar({
  permissions,
  isMasterAdmin,
}: {
  permissions: AdminPermissions;
  isMasterAdmin: boolean;
}) {
  const pathname = usePathname();
  const { mobileOpen, collapsed, closeMobile } = useSidebar();

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap outside it. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-green-950 bg-green-900 px-4 py-6 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:transition-[width,padding] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-0 md:overflow-hidden md:border-0 md:px-0" : "md:w-60 md:px-4"}`}
      >
        <div className="flex items-center justify-between px-2">
          <span className="whitespace-nowrap text-base font-semibold text-white">Patrolling Admin</span>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close sidebar"
            className="rounded-md p-1 text-green-200 hover:bg-green-800 hover:text-white md:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (item) =>
              (!item.masterOnly || isMasterAdmin) &&
              hasAdminPermission({ permissions }, item.section, "view"),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.title} className="min-w-56 space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-green-300/70">
                {group.title}
              </p>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`block whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-700 text-white"
                        : "text-green-100/80 hover:bg-green-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
