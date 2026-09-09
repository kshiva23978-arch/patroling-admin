"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/lib/ui-classes";
import type { Destination } from "@/lib/resources/destinations";
import type { Beach } from "@/lib/resources/beaches";
import type { BeachCleaningRangerOption, BeachCleaningStatus } from "@/lib/resources/beach-cleaning-activities";

/**
 * Destination / Beach / Ranger dropdowns for the Beach Cleaning list —
 * preserves the status tab. Beach options narrow to the selected
 * destination (same UX as the mobile app's create-drive form); picking a
 * different destination drops any beach filter that no longer applies.
 */
export function BeachCleaningFilters({
  destinations,
  beaches,
  rangers,
  currentDestinationId,
  currentBeachId,
  currentRangerId,
  currentStatus,
}: {
  destinations: Destination[];
  beaches: Beach[];
  rangers: BeachCleaningRangerOption[];
  currentDestinationId?: string;
  currentBeachId?: string;
  currentRangerId?: string;
  currentStatus?: BeachCleaningStatus;
}) {
  const router = useRouter();

  const beachOptions = currentDestinationId
    ? beaches.filter((b) => b.destination_id === currentDestinationId)
    : beaches;

  const navigate = (next: { destinationId?: string; beachId?: string; rangerId?: string }) => {
    const params = new URLSearchParams();
    if (currentStatus) params.set("status", currentStatus);

    const destinationId = "destinationId" in next ? next.destinationId : currentDestinationId;
    const beachId = "beachId" in next ? next.beachId : currentBeachId;
    const rangerId = "rangerId" in next ? next.rangerId : currentRangerId;

    if (destinationId) params.set("destination_id", destinationId);
    // Dropping the beach filter when it belongs to a destination that's no
    // longer selected — an id from the wrong destination would just silently
    // match nothing on the backend.
    if (beachId && (!destinationId || beaches.some((b) => b.id === beachId && b.destination_id === destinationId))) {
      params.set("beach_id", beachId);
    }
    if (rangerId) params.set("created_by", rangerId);

    const query = params.toString();
    router.push(`/beach-cleaning-activities${query ? `?${query}` : ""}`);
  };

  const rangerLabel = (r: BeachCleaningRangerOption) => r.name || r.employee_id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentDestinationId ?? ""}
        onChange={(e) => navigate({ destinationId: e.target.value || undefined, beachId: undefined })}
        className={`${inputClass} w-auto`}
      >
        <option value="">All Destinations</option>
        {destinations.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={currentBeachId ?? ""}
        onChange={(e) => navigate({ beachId: e.target.value || undefined })}
        className={`${inputClass} w-auto`}
      >
        <option value="">All Beaches</option>
        {beachOptions.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        value={currentRangerId ?? ""}
        onChange={(e) => navigate({ rangerId: e.target.value || undefined })}
        className={`${inputClass} w-auto`}
      >
        <option value="">All Rangers</option>
        {rangers.map((r) => (
          <option key={r.id} value={r.id}>
            {rangerLabel(r)}
          </option>
        ))}
      </select>
    </div>
  );
}
