import { requirePermission } from "@/lib/auth";

export default async function RolesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("roles", "manage");
  return <>{children}</>;
}
