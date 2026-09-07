import { requirePermission } from "@/lib/auth";

export default async function BeachesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beaches", "manage");
  return <>{children}</>;
}
