import { getTalisMapsPlatformSettings } from "@/lib/talismaps/platform-settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getTalisMapsPlatformSettings();
  return Response.json({
    defaultProviderId: settings.defaultProviderId,
    defaultBasemapView: settings.defaultBasemapView,
  });
}
