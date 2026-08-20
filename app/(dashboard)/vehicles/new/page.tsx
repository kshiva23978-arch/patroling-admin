import { ResourceForm } from "@/components/crud/ResourceForm";
import { vehicleCreateDefaults, VEHICLE_TYPES } from "@/lib/schemas/vehicles";
import { listAllRanges } from "@/lib/resources/ranges";
import { createVehicleAction } from "../actions";

export default async function NewVehiclePage() {
  const ranges = await listAllRanges();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Vehicle</h1>
      <ResourceForm
        schemaKey="vehicleCreateSchema"
        defaultValues={vehicleCreateDefaults}
        action={createVehicleAction}
        submitLabel="Create Vehicle"
        cancelHref="/vehicles"
        fields={[
          { name: "rangeId", label: "Range", type: "select", options: ranges.map((r) => ({ value: r.id, label: r.range_name })) },
          { name: "registrationNumber", label: "Registration Number", type: "text" },
          { name: "type", label: "Type", type: "select", options: VEHICLE_TYPES.map((t) => ({ value: t, label: t })) },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
