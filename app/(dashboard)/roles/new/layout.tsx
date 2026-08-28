import { requireMasterAdmin } from "@/lib/auth";

export default async function RolesNewLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
