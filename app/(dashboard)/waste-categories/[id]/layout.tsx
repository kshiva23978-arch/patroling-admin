import { requirePermission } from "@/lib/auth";

export default async function WasteCategoriesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("waste_categories", "manage");
  return <>{children}</>;
}
