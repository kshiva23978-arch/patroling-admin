import { requirePermission } from "@/lib/auth";

export default async function WasteCategoriesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("waste_categories", "manage");
  return <>{children}</>;
}
