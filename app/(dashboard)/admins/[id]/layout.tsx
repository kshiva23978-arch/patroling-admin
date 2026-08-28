import { requirePermission } from "@/lib/auth";

export default async function AdminsEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("admins", "manage");
  return <>{children}</>;
}
