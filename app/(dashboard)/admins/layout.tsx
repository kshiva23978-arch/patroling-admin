import { requirePermission } from "@/lib/auth";

export default async function AdminsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("admins", "view");
  return <>{children}</>;
}
