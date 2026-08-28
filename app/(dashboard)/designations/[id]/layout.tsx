import { requireMasterAdmin } from "@/lib/auth";

export default async function DesignationsEditLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
