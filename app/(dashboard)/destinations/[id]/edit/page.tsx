import { ResourceForm } from "@/components/crud/ResourceForm";
import { getDestination } from "@/lib/resources/destinations";
import { updateDestinationAction } from "../../actions";

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = await getDestination(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Destination</h1>
      <ResourceForm
        schemaKey="destinationSchema"
        defaultValues={{ name: destination.name, status: destination.status }}
        action={updateDestinationAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/destinations"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
