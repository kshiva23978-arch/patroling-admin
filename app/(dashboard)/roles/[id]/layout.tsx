import { requireMasterAdmin } from "@/lib/auth";

export default async function RolesEditLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
