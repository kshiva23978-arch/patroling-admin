import { requirePermission } from "@/lib/auth";

export default async function AdminsNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("admins", "manage");
  return <>{children}</>;
}
