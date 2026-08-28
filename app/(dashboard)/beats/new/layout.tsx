import { requirePermission } from "@/lib/auth";

export default async function BeatsNewLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beats", "manage");
  return <>{children}</>;
}
