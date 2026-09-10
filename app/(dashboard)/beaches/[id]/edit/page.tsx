import { ResourceForm } from "@/components/crud/ResourceForm";
import { getBeach } from "@/lib/resources/beaches";
import { listAllDestinations } from "@/lib/resources/destinations";
import { updateBeachAction } from "../../actions";

export default async function EditBeachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [beach, destinations] = await Promise.all([getBeach(id), listAllDestinations()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Beach</h1>
      <ResourceForm
        schemaKey="beachUpdateSchema"
        defaultValues={{
          destinationId: beach.destination_id,
          sharedDestinationId: beach.shared_destination_id ?? "",
          name: beach.name,
          status: beach.status,
        }}
        action={updateBeachAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/beaches"
        fields={[
          {
            name: "destinationId",
            label: "Destination",
            type: "select",
            options: destinations.map((d) => ({ value: d.id, label: d.name })),
          },
          {
            name: "sharedDestinationId",
            label: "Also share with destination",
            type: "select",
            options: destinations.map((d) => ({ value: d.id, label: d.name })),
            helpText: "Optional. Shows this beach in one other destination's beach list too.",
          },
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
