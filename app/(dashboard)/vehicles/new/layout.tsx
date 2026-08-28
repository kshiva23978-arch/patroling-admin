import { requirePermission } from "@/lib/auth";

export default async function VehiclesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("vehicles", "manage");
  return <>{children}</>;
}
