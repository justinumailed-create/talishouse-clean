"use server";

import { revalidatePath } from "next/cache";
import {
  getTalisMapsPlatformSettings,
  updateTalisMapsPlatformSettings,
} from "@/lib/talismaps/platform-settings";
import {
  isMapBasemapView,
  isMapProviderId,
  type MapBasemapView,
  type MapProviderId,
} from "@/lib/talismaps/map-engine";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";

export async function loadTalisMapsSettingsAction() {
  return getTalisMapsPlatformSettings();
}

export async function saveTalisMapsSettingsAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const providerRaw = formData.get("defaultProviderId");
  const viewRaw = formData.get("defaultBasemapView");

  if (!isMapProviderId(providerRaw)) {
    return { ok: false, error: "Select a valid default provider." };
  }
  if (!isMapBasemapView(viewRaw)) {
    return { ok: false, error: "Select a valid default view." };
  }

  const result = await updateTalisMapsPlatformSettings({
    defaultProviderId: providerRaw as MapProviderId,
    defaultBasemapView: viewRaw as MapBasemapView,
    updatedBy: "talismaps-settings",
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(TALISMAPS_ROUTES.SETTINGS);
  revalidatePath(TALISMAPS_ROUTES.DASHBOARD_SETTINGS);
  revalidatePath(TALISMAPS_ROUTES.DASHBOARD);
  revalidatePath(TALISMAPS_ROUTES.EDITOR);

  return { ok: true };
}
