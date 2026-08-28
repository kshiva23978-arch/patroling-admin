import { requirePermission } from "@/lib/auth";

export default async function DashboardSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("dashboard", "view");
  return <>{children}</>;
}
