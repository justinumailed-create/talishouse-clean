"use server";

import { submitBuildRequest } from "@/app/talispros/build-mapsite/actions";
import { parseRegistrationMarket } from "@/lib/registration-market";

export async function submitMarketRegistration(formData: FormData) {
  const marketType = formData.get("marketType");
  const market = parseRegistrationMarket(
    typeof marketType === "string" ? marketType : null
  );

  if (!market) {
    return { success: false, error: "Invalid market type." };
  }

  formData.set("marketType", market);

  const existingComments = formData.get("additionalComments");
  const fromMapSite = Boolean(formData.get("mapsiteId"));
  formData.set("helpPreference", "marketing_manager_review");
  formData.set(
    "additionalComments",
    typeof existingComments === "string" && existingComments.trim()
      ? existingComments
      : fromMapSite
        ? `Submitted from MapSite™ application: ${market}`
        : `Submitted from market page: ${market}`
  );

  return submitBuildRequest(formData);
}
