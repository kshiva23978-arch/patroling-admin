import { requirePermission } from "@/lib/auth";

export default async function CountriesSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("countries", "view");
  return <>{children}</>;
}
