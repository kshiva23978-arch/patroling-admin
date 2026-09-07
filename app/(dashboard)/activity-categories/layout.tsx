import { requirePermission } from "@/lib/auth";

export default async function ActivityCategoriesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("activity_categories", "view");
  return <>{children}</>;
}
