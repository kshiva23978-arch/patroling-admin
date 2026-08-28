import { getCaseEntry, listCaseRoutePoints } from "@/lib/resources/case-entries";
import { CaseTrackingClient } from "./CaseTrackingClient";

export default async function CaseTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, routePoints] = await Promise.all([getCaseEntry(id), listCaseRoutePoints(id)]);

  return <CaseTrackingClient caseId={id} initialEntry={entry} initialRoutePoints={routePoints} />;
}
