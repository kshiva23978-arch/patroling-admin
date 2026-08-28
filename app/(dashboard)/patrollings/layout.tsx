import { requirePermission } from "@/lib/auth";

export default async function PatrollingsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patrollings", "view");
  return <>{children}</>;
}
