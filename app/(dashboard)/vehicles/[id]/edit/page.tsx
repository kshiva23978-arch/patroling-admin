import { ResourceForm } from "@/components/crud/ResourceForm";
import { VEHICLE_TYPES } from "@/lib/schemas/vehicles";
import { getVehicle } from "@/lib/resources/vehicles";
import { getRange } from "@/lib/resources/ranges";
import { updateVehicleAction } from "../../actions";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  const range = await getRange(vehicle.range_id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Vehicle</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Range: <span className="font-medium text-zinc-900 dark:text-zinc-100">{range.range_name}</span> (fixed at creation)
      </p>
      <ResourceForm
        schemaKey="vehicleUpdateSchema"
        defaultValues={{ registrationNumber: vehicle.registration_number, type: vehicle.type, status: vehicle.status }}
        action={updateVehicleAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/vehicles"
        fields={[
          { name: "registrationNumber", label: "Registration Number", type: "text" },
          { name: "type", label: "Type", type: "select", options: VEHICLE_TYPES.map((t) => ({ value: t, label: t })) },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
