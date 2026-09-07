import { requirePermission } from "@/lib/auth";

export default async function DestinationsNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("destinations", "manage");
  return <>{children}</>;
}
