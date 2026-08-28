import { LogoutButton } from "./LogoutButton";
import { SidebarToggleButton } from "./SidebarToggleButton";
import type { AdminIdentity } from "@/lib/auth";

export function Topbar({ admin }: { admin: AdminIdentity }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-green-100 bg-white px-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarToggleButton />
        <div className="truncate text-sm text-zinc-500">
          Signed in as <span className="font-medium text-zinc-900">{admin.a_employee_id}</span>
        </div>
      </div>
      <LogoutButton />
    </header>
  );
}
