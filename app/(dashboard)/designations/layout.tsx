import { requireMasterAdmin } from "@/lib/auth";

export default async function DesignationsSectionLayout({ children }: { children: React.ReactNode }) {
  await requireMasterAdmin();
  return <>{children}</>;
}
