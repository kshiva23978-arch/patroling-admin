import { getPatrolling, listRoutePoints } from "@/lib/resources/patrollings";
import { PatrolTrackingClient } from "./PatrolTrackingClient";

export default async function PatrolTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, routePoints] = await Promise.all([getPatrolling(id), listRoutePoints(id)]);

  return <PatrolTrackingClient entryId={id} initialEntry={entry} initialRoutePoints={routePoints} />;
}
