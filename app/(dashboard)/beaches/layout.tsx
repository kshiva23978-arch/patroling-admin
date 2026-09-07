import { requirePermission } from "@/lib/auth";

export default async function BeachesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beaches", "view");
  return <>{children}</>;
}
