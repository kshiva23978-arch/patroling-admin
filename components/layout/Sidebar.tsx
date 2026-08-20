"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    title: "Reference data",
    items: [
      { href: "/roles", label: "Roles" },
      { href: "/designations", label: "Designations" },
      { href: "/patrolling-modes", label: "Patrolling Modes" },
      { href: "/patrol-types", label: "Patrol Types" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/patrollings", label: "Patrollings" },
      { href: "/ranges", label: "Ranges" },
      { href: "/beats", label: "Beats" },
      { href: "/vehicles", label: "Vehicles" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admins", label: "Admins" },
      { href: "/users", label: "Field Users" },
      { href: "/user-details", label: "User Details" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">Patrolling Admin</div>
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
