import { requirePermission } from "@/lib/auth";

export default async function RangesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("ranges", "manage");
  return <>{children}</>;
}
