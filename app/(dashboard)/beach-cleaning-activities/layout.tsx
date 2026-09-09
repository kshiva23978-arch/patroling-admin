import { requirePermission } from "@/lib/auth";

export default async function BeachCleaningActivitiesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beach_cleaning", "view");
  return <>{children}</>;
}
