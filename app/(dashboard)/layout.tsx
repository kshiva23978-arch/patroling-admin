import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex h-screen w-full">
      <Sidebar permissions={admin.permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar admin={admin} />
        <main className="flex-1 overflow-y-auto bg-green-50 p-6">{children}</main>
      </div>
    </div>
  );
}
