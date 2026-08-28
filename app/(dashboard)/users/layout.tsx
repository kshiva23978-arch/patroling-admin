import { requirePermission } from "@/lib/auth";

export default async function UsersSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("users", "view");
  return <>{children}</>;
}
