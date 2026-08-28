import { requirePermission } from "@/lib/auth";

export default async function RolesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("roles", "view");
  return <>{children}</>;
}
