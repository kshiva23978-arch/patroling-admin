import { requireMasterAdmin } from "@/lib/auth";

export default async function AppVersionsLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
