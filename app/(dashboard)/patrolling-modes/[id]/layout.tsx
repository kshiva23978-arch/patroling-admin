import { requirePermission } from "@/lib/auth";

export default async function PatrollingModesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patrolling_modes", "manage");
  return <>{children}</>;
}
