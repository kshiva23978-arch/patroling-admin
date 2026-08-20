import { cardClass } from "@/lib/ui-classes";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
      <div className={`p-6 ${cardClass}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Use the sidebar to manage roles, designations, ranges, beats, vehicles, admins, and field users.
        </p>
      </div>
    </div>
  );
}
