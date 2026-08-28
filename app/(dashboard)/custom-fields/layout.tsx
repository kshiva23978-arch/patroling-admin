import { requirePermission } from "@/lib/auth";

export default async function CustomFieldsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("custom_fields", "view");
  return <>{children}</>;
}
