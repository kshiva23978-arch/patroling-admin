import { redirect } from "next/navigation";
import { getNgoSessionIdentity } from "@/lib/ngo-session";
import { ngoFetchPaginated } from "@/lib/ngo-client";
import { cardClass, badgeClass } from "@/lib/ui-classes";
import { LogoutLink } from "./logout-link";

interface Activity {
  id: string;
  name: string;
  description: string | null;
  conducted_by: string;
  status: "in_progress" | "completed";
  location: { latitude: number | null; longitude: number | null; address: string | null };
  report: string | null;
  started_at: string | null;
  ended_at: string | null;
}

/**
 * Read-only "my own conducted activities" view for an NGO/organization
 * account — reuses their field-app login (see `lib/ngo-session.ts`) rather
 * than a separate admin-table account. The backend already scopes
 * `GET /app/activities` to the authenticated app user (see
 * `ActivityController::index`), so no extra filtering is needed here.
 */
export default async function MyActivitiesPage() {
  const identity = await getNgoSessionIdentity();
  if (!identity) {
    redirect("/ngo-login");
  }

  const { data: activities } = await ngoFetchPaginated<Activity>("/app/activities");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">My Activities</h1>
            <p className="text-sm text-zinc-500">{identity.name ?? identity.employeeId}</p>
          </div>
          <LogoutLink />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        {activities.length === 0 && (
          <p className="text-sm text-zinc-500">No activities conducted yet.</p>
        )}

        {activities.map((activity) => (
          <div key={activity.id} className={`space-y-2 p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">{activity.name}</h2>
              <span className={badgeClass(activity.status === "completed")}>
                {activity.status === "completed" ? "Completed" : "In Progress"}
              </span>
            </div>
            <p className="text-xs text-zinc-500">Conducted by {activity.conducted_by}</p>
            {activity.description && <p className="text-sm text-zinc-700">{activity.description}</p>}
            {activity.location.address && (
              <p className="text-xs text-zinc-500">{activity.location.address}</p>
            )}
            {activity.report && (
              <p className="border-t border-zinc-100 pt-2 text-sm text-zinc-700">{activity.report}</p>
            )}
            {/* Fixed to the app's own operating timezone rather than the
                server's — see `PatrolDetails.tsx`'s `formatDateTime` for why. */}
            <p className="text-xs text-zinc-400">
              {activity.started_at
                ? new Date(activity.started_at).toLocaleString([], { timeZone: "Asia/Kolkata" })
                : ""}
              {activity.ended_at
                ? ` – ${new Date(activity.ended_at).toLocaleString([], { timeZone: "Asia/Kolkata" })}`
                : ""}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
}
