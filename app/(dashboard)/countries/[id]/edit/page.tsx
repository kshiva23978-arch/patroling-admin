import { ResourceForm } from "@/components/crud/ResourceForm";
import { getCountry } from "@/lib/resources/countries";
import { updateCountryAction } from "../../actions";

export default async function EditCountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const country = await getCountry(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Country</h1>
      <ResourceForm
        schemaKey="countrySchema"
        defaultValues={{ name: country.country_name }}
        action={updateCountryAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/countries"
        fields={[{ name: "name", label: "Country Name", type: "text" }]}
      />
    </div>
  );
}
