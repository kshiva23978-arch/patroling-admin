import { requirePermission } from "@/lib/auth";

export default async function PatrollingModesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patrolling_modes", "view");
  return <>{children}</>;
}
