import { requirePermission } from "@/lib/auth";

export default async function ReportFieldsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("activity_categories", "manage");
  return <>{children}</>;
}
