import { requirePermission } from "@/lib/auth";

export default async function BeatsSectionLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("beats", "view");
  return <>{children}</>;
}
