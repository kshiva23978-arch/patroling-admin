import { requirePermission } from "@/lib/auth";

export default async function DesignationsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("designations", "view");
  return <>{children}</>;
}
