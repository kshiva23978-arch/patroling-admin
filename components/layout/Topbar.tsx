import { LogoutButton } from "./LogoutButton";
import type { AdminIdentity } from "@/lib/auth";

export function Topbar({ admin }: { admin: AdminIdentity }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-green-100 bg-white px-6">
      <div className="text-sm text-zinc-500">
        Signed in as <span className="font-medium text-zinc-900">{admin.a_employee_id}</span>
      </div>
      <LogoutButton />
    </header>
  );
}
