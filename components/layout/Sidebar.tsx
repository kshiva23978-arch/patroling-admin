"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasAdminPermission, type AdminPermissions } from "@/lib/permissions";

interface NavItem {
  href: string;
  label: string;
  /** Matches a backend `Roles::ADMIN_SECTIONS` key — gates visibility. */
  section: string;
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
      { href: "/roles", label: "Roles", section: "roles" },
      { href: "/designations", label: "Designations", section: "designations" },
      { href: "/patrolling-modes", label: "Patrolling Modes", section: "patrolling_modes" },
      { href: "/patrol-types", label: "Patrol Types", section: "patrol_types" },
      { href: "/custom-fields", label: "Custom Fields", section: "custom_fields" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/patrollings", label: "Patrollings", section: "patrollings" },
      { href: "/activities", label: "Activities", section: "activities" },
      { href: "/ranges", label: "Ranges", section: "ranges" },
      { href: "/beats", label: "Beats", section: "beats" },
      { href: "/vehicles", label: "Vehicles", section: "vehicles" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admins", label: "Admins", section: "admins" },
      { href: "/users", label: "Field Users", section: "users" },
      { href: "/user-details", label: "User Details", section: "user_details" },
    ],
  },
];

export function Sidebar({ permissions }: { permissions: AdminPermissions }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-green-950 bg-green-900 px-4 py-6">
      <div className="px-2 text-base font-semibold text-white">Patrolling Admin</div>
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) =>
          hasAdminPermission({ permissions }, item.section, "view"),
        );
        if (items.length === 0) return null;

        return (
          <div key={group.title} className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-green-300/70">
              {group.title}
            </p>
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
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
  );
}
