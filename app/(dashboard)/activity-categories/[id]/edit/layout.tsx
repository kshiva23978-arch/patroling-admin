import { requirePermission } from "@/lib/auth";

export default async function ActivityCategoryEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("activity_categories", "manage");
  return <>{children}</>;
}
