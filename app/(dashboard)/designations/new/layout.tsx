import { requireMasterAdmin } from "@/lib/auth";

export default async function DesignationsNewLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
