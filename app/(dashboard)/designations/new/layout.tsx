import { requirePermission } from "@/lib/auth";

export default async function DesignationsNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("designations", "manage");
  return <>{children}</>;
}
