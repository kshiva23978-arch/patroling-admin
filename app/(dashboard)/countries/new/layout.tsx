import { requirePermission } from "@/lib/auth";

export default async function CountriesNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("countries", "manage");
  return <>{children}</>;
}
