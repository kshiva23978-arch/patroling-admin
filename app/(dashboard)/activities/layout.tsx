import { requirePermission } from "@/lib/auth";

export default async function ActivitiesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("activities", "view");
  return <>{children}</>;
}
