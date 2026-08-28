import { requirePermission } from "@/lib/auth";

export default async function VehiclesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("vehicles", "view");
  return <>{children}</>;
}
