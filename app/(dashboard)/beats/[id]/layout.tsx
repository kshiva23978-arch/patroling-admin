import { requirePermission } from "@/lib/auth";

export default async function BeatsEditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beats", "manage");
  return <>{children}</>;
}
