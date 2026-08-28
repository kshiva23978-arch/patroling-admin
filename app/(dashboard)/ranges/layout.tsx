import { requirePermission } from "@/lib/auth";

export default async function RangesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("ranges", "view");
  return <>{children}</>;
}
