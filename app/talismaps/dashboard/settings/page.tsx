import Link from "next/link";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";
import TalisMapsPlatformSettingsForm from "@/components/talismaps/platform/TalisMapsPlatformSettingsForm";
import { getTalisMapsPlatformSettings } from "@/lib/talismaps/platform-settings";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";

export const dynamic = "force-dynamic";

export default async function TalisMapsDashboardSettingsPage() {
  const settings = await getTalisMapsPlatformSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <TalisMapsPageHeader
        title="Settings"
        description="Choose the default MapProvider and map view for Talismaps™."
      />

      <div className="space-y-8">
        <TalisMapsPlatformSettingsForm initialSettings={settings} />

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-neutral-900">Platform Administration</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Manage platform-level configuration, migrations, and ecosystem integrations.
          </p>
          <Link
            href={TALISMAPS_ROUTES.ADMIN}
            className="mt-4 inline-flex text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            Open Admin Console →
          </Link>
        </section>
      </div>
    </div>
  );
}
