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

  const dateValue = formData.get("date");
  if (typeof dateValue !== "string" || !dateValue.trim()) {
    const now = new Date();
    formData.set(
      "date",
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  }

  const existingComments = formData.get("additionalComments");
  const fromMapSite = Boolean(formData.get("mapsiteId"));
  formData.set("helpPreference", "marketing_manager_review");
  formData.set(
    "additionalComments",
    typeof existingComments === "string" && existingComments.trim()
      ? existingComments
      : fromMapSite
        ? `Submitted from Mapsite™ application: ${market}`
        : `Submitted from market page: ${market}`
  );

  return submitBuildRequest(formData);
}
