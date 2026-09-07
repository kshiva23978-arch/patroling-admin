import { ResourceForm } from "@/components/crud/ResourceForm";
import { beachCreateDefaults } from "@/lib/schemas/beaches";
import { listAllDestinations } from "@/lib/resources/destinations";
import { createBeachAction } from "../actions";

export default async function NewBeachPage() {
  const destinations = await listAllDestinations();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Beach</h1>
      <ResourceForm
        schemaKey="beachCreateSchema"
        defaultValues={beachCreateDefaults}
        action={createBeachAction}
        submitLabel="Create Beach"
        cancelHref="/beaches"
        fields={[
          {
            name: "destinationId",
            label: "Destination",
            type: "select",
            options: destinations.map((d) => ({ value: d.id, label: d.name })),
          },
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
