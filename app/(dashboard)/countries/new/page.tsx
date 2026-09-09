import { ResourceForm } from "@/components/crud/ResourceForm";
import { countryDefaults } from "@/lib/schemas/countries";
import { createCountryAction } from "../actions";

export default function NewCountryPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Country</h1>
      <ResourceForm
        schemaKey="countrySchema"
        defaultValues={countryDefaults}
        action={createCountryAction}
        submitLabel="Create Country"
        cancelHref="/countries"
        fields={[{ name: "name", label: "Country Name", type: "text" }]}
      />
    </div>
  );
}
