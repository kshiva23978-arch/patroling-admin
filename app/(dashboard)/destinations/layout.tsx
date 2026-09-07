import { requirePermission } from "@/lib/auth";

export default async function DestinationsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("destinations", "view");
  return <>{children}</>;
}
