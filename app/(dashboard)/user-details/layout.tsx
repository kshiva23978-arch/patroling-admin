import { requirePermission } from "@/lib/auth";

export default async function UserDetailsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("user_details", "view");
  return <>{children}</>;
}
