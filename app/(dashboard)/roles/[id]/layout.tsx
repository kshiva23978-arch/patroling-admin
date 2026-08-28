import { requirePermission } from "@/lib/auth";

export default async function RolesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("roles", "manage");
  return <>{children}</>;
}
