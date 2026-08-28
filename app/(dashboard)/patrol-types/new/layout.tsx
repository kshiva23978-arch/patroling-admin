import { requirePermission } from "@/lib/auth";

export default async function PatrolTypesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patrol_types", "manage");
  return <>{children}</>;
}
