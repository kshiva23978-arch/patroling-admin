import { requireMasterAdmin } from "@/lib/auth";

export default async function RolesSectionLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
