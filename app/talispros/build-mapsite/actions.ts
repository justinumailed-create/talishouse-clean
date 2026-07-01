"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import { publishBuildMapSite } from "@/lib/build-mapsite-publish";
import { uploadBuildMapsiteAsset } from "@/lib/build-mapsite-upload";
import {
  lookupFastCodeRegistrationTier,
  buildMapsiteRedirectUrl,
  type RegistrationFastCodeTier,
} from "@/lib/registration-fast-code-routing";
import {
  sendBuildRequestReceived,
  sendFastCodeGenerated,
} from "@/lib/email";
import { generateFastCode } from "@/services/fast-code.service";
import { FastCodeValidationError } from "@/validators/fast-code.validator";

export interface ActionResult {
  success: boolean;
  fastCode?: string;
  redirectUrl?: string;
  error?: string;
}

export interface BuildFields {
  date: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: string;
  fastCode: string;
  streetAddress: string;
  latitude: string;
  longitude: string;
  pinWriteup: string;
  futurePinColor: string;
  futurePinIcon: string;
  futurePinBorder: string;
  futurePinLabel: string;
  helpPreference: string;
  additionalComments: string;
  consentCommunications: boolean;
  consentData: boolean;
  turnstileToken: string;
}

function requiresFastCodeValidation(accountType: string): boolean {
  return accountType === "derivative" || accountType.startsWith("adpro");
}

function expectedTierForAccountType(
  accountType: string
): RegistrationFastCodeTier | null {
  if (accountType === "derivative") return "derivative";
  if (accountType.startsWith("adpro")) return "adpro";
  return null;
}

export async function validateBuildMapsiteFastCode(
  code: string,
  accountType: string
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const expected = expectedTierForAccountType(accountType);
  if (!expected) {
    return {
      ok: false,
      error: "FAST Code validation is not required for Root accounts.",
    };
  }

  const lookup = await lookupFastCodeRegistrationTier(code);
  if (!lookup.found) {
    return {
      ok: false,
      error: "FAST Code not recognized. Check the code and try again.",
    };
  }

  if (!lookup.tier) {
    return {
      ok: false,
      error:
        "FAST Code found but has no account type. Set Account Type in admin FAST Codes.",
    };
  }

  if (lookup.tier !== expected) {
    return {
      ok: false,
      error:
        expected === "derivative"
          ? "This FAST Code is not linked to a Derivative Account™."
          : "This FAST Code is not linked to an AdPro™ account.",
    };
  }

  return { ok: true, code: lookup.code };
}

function validate(fields: BuildFields): string | null {
  if (!fields.firstName.trim()) return "First name is required";
  if (!fields.lastName.trim()) return "Last name is required";
  if (!fields.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    return "Invalid email format";
  if (!fields.accountType) return "Account type is required";
  if (requiresFastCodeValidation(fields.accountType) && !fields.fastCode.trim()) {
    return "FAST Code is required";
  }

  const hasAddress = fields.streetAddress.trim().length > 0;
  const lat = Number.parseFloat(fields.latitude);
  const lng = Number.parseFloat(fields.longitude);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!hasAddress && !hasCoords) {
    return "Street address or GPS coordinates are required";
  }

  if (fields.pinWriteup.length > 170) {
    return "PIN write-up must be 170 characters or fewer";
  }

  if (!fields.consentData) return "Data processing consent is required";
  return null;
}

async function uploadFile(
  requestId: string,
  fieldName: string,
  file: File
): Promise<string | null> {
  return uploadBuildMapsiteAsset(requestId, fieldName, file);
}

function readUploadedUrl(formData: FormData, fieldName: string): string | null {
  const value = formData.get(`${fieldName}Url`);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readTebPictureUrls(formData: FormData): string[] {
  const raw = formData.get("tebPictureUrls");
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  } catch {
    return [];
  }
}

export async function submitBuildRequest(
  formData: FormData
): Promise<ActionResult> {
  const fields: BuildFields = {
    date: (formData.get("date") as string) || "",
    firstName: (formData.get("firstName") as string) || "",
    lastName: (formData.get("lastName") as string) || "",
    email: (formData.get("email") as string) || "",
    accountType: (formData.get("accountType") as string) || "",
    fastCode: (formData.get("fastCode") as string) || "",
    streetAddress: (formData.get("streetAddress") as string) || "",
    latitude: (formData.get("latitude") as string) || "",
    longitude: (formData.get("longitude") as string) || "",
    pinWriteup: (formData.get("pinWriteup") as string) || "",
    futurePinColor: (formData.get("futurePinColor") as string) || "",
    futurePinIcon: (formData.get("futurePinIcon") as string) || "",
    futurePinBorder: (formData.get("futurePinBorder") as string) || "",
    futurePinLabel: (formData.get("futurePinLabel") as string) || "",
    helpPreference: (formData.get("helpPreference") as string) || "",
    additionalComments: (formData.get("additionalComments") as string) || "",
    consentCommunications: formData.get("consentCommunications") === "true",
    consentData: formData.get("consentData") === "true",
    turnstileToken: (formData.get("turnstileToken") as string) || "",
  };

  const validationError = validate(fields);
  if (validationError) {
    return { success: false, error: validationError };
  }

  let sponsorFastCode: string | null = null;
  if (requiresFastCodeValidation(fields.accountType)) {
    const fastCodeValidation = await validateBuildMapsiteFastCode(
      fields.fastCode,
      fields.accountType
    );
    if (!fastCodeValidation.ok) {
      return { success: false, error: fastCodeValidation.error };
    }
    sponsorFastCode = fastCodeValidation.code;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const requestIdValue = formData.get("requestId");
    const requestId =
      typeof requestIdValue === "string" && requestIdValue.trim()
        ? requestIdValue.trim()
        : crypto.randomUUID();

    const fileFields = [
      "picture",
      "logo",
      "pinImage",
      "ttvMonologuePdf",
      "ttvBackgroundImage",
      "tebWriteUpPdf",
    ] as const;

    const fileUrls: Record<string, string | null> = {};
    for (const fieldName of fileFields) {
      const preUploadedUrl = readUploadedUrl(formData, fieldName);
      if (preUploadedUrl) {
        fileUrls[fieldName] = preUploadedUrl;
        continue;
      }

      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        fileUrls[fieldName] = await uploadFile(requestId, fieldName, file);
      }
    }

    let tebPictureUrls = readTebPictureUrls(formData);
    if (tebPictureUrls.length === 0) {
      for (let i = 0; ; i++) {
        const file = formData.get(`tebPicture_${i}`) as File | null;
        if (!file || file.size === 0) break;
        const url = await uploadFile(requestId, `tebPicture_${i}`, file);
        if (url) tebPictureUrls.push(url);
      }
    }

    const parsedLatitude = Number.parseFloat(fields.latitude);
    const parsedLongitude = Number.parseFloat(fields.longitude);
    const hasCoordinates =
      Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);

    const buildRequest: Database["public"]["Tables"]["build_requests"]["Insert"] = {
      id: requestId,
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: "",
      account_type: fields.accountType,
      media_focus: null,
      address: fields.streetAddress.trim() || null,
      geo_location: hasCoordinates
        ? `${parsedLatitude},${parsedLongitude}`
        : null,
      street_address: fields.streetAddress.trim() || null,
      latitude: hasCoordinates ? parsedLatitude : null,
      longitude: hasCoordinates ? parsedLongitude : null,
      pin_writeup: fields.pinWriteup.trim() || null,
      future_pin_color: fields.futurePinColor.trim() || null,
      future_pin_icon: fields.futurePinIcon.trim() || null,
      future_pin_border: fields.futurePinBorder.trim() || null,
      future_pin_label: fields.futurePinLabel.trim() || null,
      status: "pending",
    };

    const { error: buildError } = await supabaseAdmin
      .from("build_requests")
      .insert(buildRequest);

    if (buildError) {
      console.error("[build-mapsite] Build request insert error:", buildError);
      return {
        success: false,
        error: `Failed to save request: ${buildError.message}`,
      };
    }

    let fastCode: string;
    try {
      fastCode = await generateFastCode({
        firstName: fields.firstName,
        lastName: fields.lastName,
      });
    } catch (err) {
      const message =
        err instanceof FastCodeValidationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to generate FAST Code";
      return { success: false, error: message };
    }

    const published = await publishBuildMapSite({
      fastCode,
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      accountType: fields.accountType,
      streetAddress: fields.streetAddress,
      latitude: hasCoordinates ? parsedLatitude : null,
      longitude: hasCoordinates ? parsedLongitude : null,
      pinWriteup: fields.pinWriteup,
      futurePinLabel: fields.futurePinLabel,
      profileImageUrl: fileUrls.picture ?? null,
      logoImageUrl: fileUrls.logo ?? null,
      headerImageUrl: fileUrls.ttvBackgroundImage ?? null,
      galleryImageUrls: tebPictureUrls,
      sponsorFastCode,
    });

    fastCode = published.fastCode;

    const fastCodeRecord: Database["public"]["Tables"]["fast_codes"]["Insert"] = {
      code: fastCode,
      type: "mapsite",
      request_id: requestId,
      mapsite_id: published.mapsiteId,
      account_type: fields.accountType,
    };

    const { error: fcError } = await supabaseAdmin
      .from("fast_codes")
      .insert(fastCodeRecord);

    if (fcError) {
      console.error("[build-mapsite] Fast code insert error:", fcError);
      return {
        success: false,
        error: `Failed to save FAST Code: ${fcError.message}`,
      };
    }

    const recipientName = `${fields.firstName.trim()} ${fields.lastName.trim()}`.trim();
    const redirectUrl = buildMapsiteRedirectUrl(fastCode);
    const mapsiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://talispros.com";

    sendBuildRequestReceived({
      to: fields.email.trim(),
      recipientName,
      requestId,
    }).then((result) => {
      if (!result.sent) {
        console.warn("[build-mapsite] Build request email not sent:", result.error);
      }
    });

    sendFastCodeGenerated({
      to: fields.email.trim(),
      recipientName,
      fastCode,
      mapsiteUrl: `${mapsiteUrl}${redirectUrl}`,
    }).then((result) => {
      if (!result.sent) {
        console.warn("[build-mapsite] Fast code email not sent:", result.error);
      }
    });

    if (Object.keys(fileUrls).length > 0 || tebPictureUrls.length > 0) {
      const assetRecord: Database["public"]["Tables"]["mapsite_assets"]["Insert"] = {
        request_id: requestId,
        profile_image: fileUrls.picture ?? null,
        logo_image: fileUrls.logo ?? null,
        monologue_pdf: fileUrls.ttvMonologuePdf ?? null,
        pin_image: fileUrls.pinImage ?? null,
        ebook_pdf: fileUrls.tebWriteUpPdf ?? null,
      };

      const { error: assetError } = await supabaseAdmin
        .from("mapsite_assets")
        .insert(assetRecord);

      if (assetError) {
        console.error("[build-mapsite] Asset insert error:", assetError);
      }
    }

    const mapsiteRequest: Database["public"]["Tables"]["mapsite_requests"]["Insert"] = {
      request_id: requestId,
      type: "standard",
      status: "pending",
    };

    const { error: msError } = await supabaseAdmin
      .from("mapsite_requests")
      .insert(mapsiteRequest);

    if (msError) {
      console.error("[build-mapsite] Mapsite request insert error:", msError);
    }

    const queueItem: Database["public"]["Tables"]["production_queue"]["Insert"] = {
      request_id: requestId,
      priority: 0,
      status: "queued",
    };

    const { error: pqError } = await supabaseAdmin
      .from("production_queue")
      .insert(queueItem);

    if (pqError) {
      console.error("[build-mapsite] Production queue insert error:", pqError);
    }

    const logEntry: Database["public"]["Tables"]["activity_logs"]["Insert"] = {
      table_name: "build_requests",
      record_id: requestId,
      action: "created",
      details: {
        fastCode,
        sponsorFastCode: sponsorFastCode ?? undefined,
        mapsiteId: published.mapsiteId,
        redirectUrl,
        helpPreference: fields.helpPreference,
        additionalComments: fields.additionalComments,
        streetAddress: fields.streetAddress,
        latitude: fields.latitude,
        longitude: fields.longitude,
        pinWriteup: fields.pinWriteup,
        ttvBackgroundImageUrl: fileUrls.ttvBackgroundImage ?? undefined,
        consentCommunications: fields.consentCommunications,
        consentData: fields.consentData,
        consentTimestamp: new Date().toISOString(),
        turnstileToken: fields.turnstileToken,
        tebPictureCount: tebPictureUrls.length,
        tebPictureUrls: tebPictureUrls.length > 0 ? tebPictureUrls : undefined,
      },
    };

    const { error: logError } = await supabaseAdmin
      .from("activity_logs")
      .insert(logEntry);

    if (logError) {
      console.error("[build-mapsite] Activity log insert error:", logError);
    }

    return { success: true, fastCode, redirectUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[build-mapsite] Submission error:", err);
    return { success: false, error: msg };
  }
}
