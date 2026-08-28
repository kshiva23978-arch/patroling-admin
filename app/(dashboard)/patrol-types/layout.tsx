import { requirePermission } from "@/lib/auth";

export default async function PatrolTypesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("patrol_types", "view");
  return <>{children}</>;
}
