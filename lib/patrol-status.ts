import type { PatrolStatus } from "@/lib/resources/patrollings";

export function patrolStatusLabel(status: PatrolStatus): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Not Started";
  }
}

export function patrolStatusBadgeClass(status: PatrolStatus): string {
  switch (status) {
    case "in_progress":
      return "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800";
    case "completed":
      return "inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600";
    default:
      return "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800";
  }
}
