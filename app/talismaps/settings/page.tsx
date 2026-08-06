import Link from "next/link";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";
import TalisMapsPlatformSettingsForm from "@/components/talismaps/platform/TalisMapsPlatformSettingsForm";
import { TALISMAPS_PRODUCT_NAME } from "@/lib/talismaps/constants";
import { getTalisMapsPlatformSettings } from "@/lib/talismaps/platform-settings";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";

export const dynamic = "force-dynamic";

export default async function TalisMapsSettingsPage() {
  const settings = await getTalisMapsPlatformSettings();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24 lg:px-8">
      <TalisMapsPageHeader
        title={`${TALISMAPS_PRODUCT_NAME} Settings`}
        description="Configure the global MapProvider and default map view for Talismaps™."
      />

      <div className="space-y-8">
        <TalisMapsPlatformSettingsForm initialSettings={settings} />

        <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-6">
          <Link
            href={TALISMAPS_ROUTES.DASHBOARD}
            className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href={TALISMAPS_ROUTES.ADMIN}
            className="text-sm font-medium text-neutral-500 underline-offset-4 hover:underline"
          >
            Platform Admin →
          </Link>
        </div>
      </div>
    </div>
  );
}
