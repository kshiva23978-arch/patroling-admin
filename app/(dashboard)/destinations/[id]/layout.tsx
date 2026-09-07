import { requirePermission } from "@/lib/auth";

export default async function DestinationsEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("destinations", "manage");
  return <>{children}</>;
}
