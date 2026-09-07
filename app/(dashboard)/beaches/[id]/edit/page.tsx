import { ResourceForm } from "@/components/crud/ResourceForm";
import { getBeach } from "@/lib/resources/beaches";
import { getDestination } from "@/lib/resources/destinations";
import { updateBeachAction } from "../../actions";

export default async function EditBeachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beach = await getBeach(id);
  const destination = await getDestination(beach.destination_id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Beach</h1>
      <p className="text-sm text-zinc-500">
        Destination: <span className="font-medium text-zinc-900">{destination.name}</span> (fixed at creation)
      </p>
      <ResourceForm
        schemaKey="beachUpdateSchema"
        defaultValues={{ name: beach.name, status: beach.status }}
        action={updateBeachAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/beaches"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
