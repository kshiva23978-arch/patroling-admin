import { requirePermission } from "@/lib/auth";

export default async function UsersNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("users", "manage");
  return <>{children}</>;
}
