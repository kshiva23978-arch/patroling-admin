import { listAppVersions } from "@/lib/resources/app-versions";
import { AppVersionForm } from "./AppVersionForm";

/**
 * Field-app version control (master admins only). After publishing a new
 * build to the store, raise "Latest build" here so rangers get an "update
 * available" prompt; raise "Minimum supported build" only when older
 * builds must stop being used (a breaking API change, a bad release) —
 * every device below it is locked to a mandatory-update screen the next
 * time the app opens with a connection.
 */
export default async function AppVersionsPage() {
  const versions = await listAppVersions();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">App Versions</h1>
        <p className="text-sm text-zinc-500">
          Controls the update prompt rangers see on launch. Build numbers are the <code>+N</code> part of the app&rsquo;s
          version (<code>1.2.0+7</code> → build 7); the app compares builds, not version names.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {versions.map((version) => (
          <AppVersionForm key={version.platform} version={version} />
        ))}
      </div>
    </div>
  );
}
