import { requirePermission } from "@/lib/auth";

export default async function PatrolTypesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patrol_types", "manage");
  return <>{children}</>;
}
