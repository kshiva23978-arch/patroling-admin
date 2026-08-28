import { requirePermission } from "@/lib/auth";

export default async function DesignationsEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("designations", "manage");
  return <>{children}</>;
}
