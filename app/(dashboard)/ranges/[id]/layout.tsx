import { requirePermission } from "@/lib/auth";

export default async function RangesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("ranges", "manage");
  return <>{children}</>;
}
