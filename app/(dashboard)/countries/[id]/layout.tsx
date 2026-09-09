import { requirePermission } from "@/lib/auth";

export default async function CountriesEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("countries", "manage");
  return <>{children}</>;
}
