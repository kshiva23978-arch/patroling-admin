import { LogoutButton } from "./LogoutButton";
import type { AdminIdentity } from "@/lib/auth";

export function Topbar({ admin }: { admin: AdminIdentity }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{admin.a_employee_id}</span>
      </div>
      <LogoutButton />
    </header>
  );
}
