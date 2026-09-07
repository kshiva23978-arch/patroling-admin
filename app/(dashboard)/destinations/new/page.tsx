import { ResourceForm } from "@/components/crud/ResourceForm";
import { destinationDefaults } from "@/lib/schemas/destinations";
import { createDestinationAction } from "../actions";

export default function NewDestinationPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Destination</h1>
      <ResourceForm
        schemaKey="destinationSchema"
        defaultValues={destinationDefaults}
        action={createDestinationAction}
        submitLabel="Create Destination"
        cancelHref="/destinations"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
