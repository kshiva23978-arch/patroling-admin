import { requirePermission } from "@/lib/auth";

export default async function WasteCategoriesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("waste_categories", "view");
  return <>{children}</>;
}
