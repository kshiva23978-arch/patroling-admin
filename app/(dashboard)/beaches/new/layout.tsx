import { requirePermission } from "@/lib/auth";

export default async function BeachesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beaches", "manage");
  return <>{children}</>;
}
