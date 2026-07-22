"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import { uploadBuildMapsiteAsset } from "@/lib/build-mapsite-upload";
import { encodePinStyleInNotes } from "@/lib/build-request-pin-style-notes";
import { lookupFastCodeRegistrationTier, type RegistrationFastCodeTier } from "@/lib/registration-fast-code-routing";
import { sendBuildRequestReceived } from "@/lib/email";
import { generateFastCode } from "@/services/fast-code.service";
import { markMapSiteClaimedByBuildRequest } from "@/lib/talispros/mapsite-platform";
import { DEMO_MAPSITE_ID } from "@/lib/talispros/mapsite-state";

export interface ActionResult {
  success: boolean;
  requestId?: string;
  fastCode?: string;
  mapsiteId?: string;
  error?: string;
}

export interface BuildFields {
  date: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  marketType: string;
  accountType: string;
  fastCode: string;
  streetAddress: string;
  latitude: string;
  longitude: string;
  manualPlacement: boolean;
  reverseGeocodedAddress: string;
  pinWriteup: string;
  futurePinColor: string;
  futurePinIcon: string;
  futurePinBorder: string;
  futurePinLabel: string;
  futurePinWhiteCenter: boolean;
  futurePinAnimated: boolean;
  futurePinCategoryBadge: string;
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
  if (!fields.phone.trim()) return "Phone is required";
  if (!fields.company.trim()) return "Company is required";
  if (!fields.accountType) return "Account type is required";
  if (requiresFastCodeValidation(fields.accountType) && !fields.fastCode.trim()) {
    return "FAST Code is required";
  }

  const lat = Number.parseFloat(fields.latitude);
  const lng = Number.parseFloat(fields.longitude);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!hasCoords) {
    return "GPS coordinates are required (address is optional for vacant land)";
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
    phone: (formData.get("phone") as string) || "",
    company: (formData.get("company") as string) || "",
    marketType: (formData.get("marketType") as string) || "",
    accountType: (formData.get("accountType") as string) || "",
    fastCode: (formData.get("fastCode") as string) || "",
    streetAddress: (formData.get("streetAddress") as string) || "",
    latitude: (formData.get("latitude") as string) || "",
    longitude: (formData.get("longitude") as string) || "",
    manualPlacement: formData.get("manualPlacement") === "true",
    reverseGeocodedAddress:
      (formData.get("reverseGeocodedAddress") as string) || "",
    pinWriteup: (formData.get("pinWriteup") as string) || "",
    futurePinColor: (formData.get("futurePinColor") as string) || "",
    futurePinIcon: (formData.get("futurePinIcon") as string) || "",
    futurePinBorder: (formData.get("futurePinBorder") as string) || "",
    futurePinLabel: (formData.get("futurePinLabel") as string) || "",
    futurePinWhiteCenter: formData.get("futurePinWhiteCenter") === "true",
    futurePinAnimated: formData.get("futurePinAnimated") === "true",
    futurePinCategoryBadge: (formData.get("futurePinCategoryBadge") as string) || "",
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

    const mapsiteIdValue = formData.get("mapsiteId");
    const mapsiteId =
      typeof mapsiteIdValue === "string" && mapsiteIdValue.trim()
        ? mapsiteIdValue.trim()
        : null;

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

    const buildRequest = {
      id: requestId,
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      account_type: fields.accountType,
      media_focus: null,
      address: fields.streetAddress.trim() || null,
      geo_location: hasCoordinates
        ? `${parsedLatitude},${parsedLongitude}`
        : null,
      street_address: fields.streetAddress.trim() || null,
      latitude: hasCoordinates ? parsedLatitude : null,
      longitude: hasCoordinates ? parsedLongitude : null,
      manual_placement: fields.manualPlacement,
      reverse_geocoded_address:
        fields.reverseGeocodedAddress.trim() || null,
      pin_writeup: fields.pinWriteup.trim() || null,
      future_pin_color: fields.futurePinColor.trim() || null,
      future_pin_icon: fields.futurePinIcon.trim() || null,
      future_pin_border: fields.futurePinBorder.trim() || null,
      future_pin_label: fields.futurePinLabel.trim() || null,
      status: "Submitted",
      submitted_at: new Date().toISOString(),
      requested_account_type: fields.accountType,
      requested_fast_code: sponsorFastCode,
      approval_status: "Pending",
      notes: encodePinStyleInNotes(
        fields.additionalComments,
        {
          whiteCenter: fields.futurePinWhiteCenter,
          animated: fields.futurePinAnimated,
          categoryBadge: fields.futurePinCategoryBadge.trim() || null,
        },
        {
          manualPlacement: fields.manualPlacement,
          reverseGeocodedAddress:
            fields.reverseGeocodedAddress.trim() || null,
        }
      ),
      description: fields.pinWriteup.trim() || null,
      company: fields.company.trim(),
      market_type: fields.marketType.trim() || null,
      property_title: fields.futurePinLabel.trim() || null,
      logo: fileUrls.logo ?? null,
      gallery_images: tebPictureUrls,
      video: fileUrls.ttvBackgroundImage ?? null,
      linked_mapsite_id: mapsiteId,
    };

    let { error: buildError } = await supabaseAdmin
      .from("build_requests")
      .insert(buildRequest);

    if (
      buildError &&
      /manual_placement|reverse_geocoded_address/i.test(buildError.message)
    ) {
      const {
        manual_placement: _manualPlacement,
        reverse_geocoded_address: _reverseGeocodedAddress,
        ...compatibleRequest
      } = buildRequest;
      const retry = await supabaseAdmin
        .from("build_requests")
        .insert(compatibleRequest);
      buildError = retry.error;
    }

    if (buildError) {
      console.error("[build-mapsite] Build request insert error:", buildError);
      return {
        success: false,
        error: `Failed to save request: ${buildError.message}`,
      };
    }

    const recipientName = `${fields.firstName.trim()} ${fields.lastName.trim()}`.trim();

    sendBuildRequestReceived({
      to: fields.email.trim(),
      recipientName,
      requestId,
    }).then((result) => {
      if (!result.sent) {
        console.warn("[build-mapsite] Build request email not sent:", result.error);
      }
    });

    const marketingEmails = (process.env.MARKETING_MANAGER_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    for (const marketingEmail of marketingEmails) {
      sendBuildRequestReceived({
        to: marketingEmail,
        recipientName: "Marketing Manager",
        requestId,
      }).then((result) => {
        if (!result.sent) {
          console.warn(
            "[build-mapsite] Marketing notification email not sent:",
            result.error
          );
        }
      });
    }

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
        requestId,
        sponsorFastCode: sponsorFastCode ?? undefined,
        helpPreference: fields.helpPreference,
        additionalComments: fields.additionalComments,
        company: fields.company,
        phone: fields.phone,
        marketType: fields.marketType,
        streetAddress: fields.streetAddress,
        latitude: fields.latitude,
        longitude: fields.longitude,
        manualPlacement: fields.manualPlacement,
        reverseGeocodedAddress: fields.reverseGeocodedAddress,
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

    let issuedFastCode: string | undefined = sponsorFastCode ?? undefined;

    if (!requiresFastCodeValidation(fields.accountType)) {
      try {
        const generatedCode = await generateFastCode({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
        });

        const { error: fastCodeError } = await supabaseAdmin.from("fast_codes").upsert(
          {
            code: generatedCode,
            type: "mapsite",
            request_id: requestId,
            account_type: fields.accountType,
          },
          { onConflict: "code" }
        );

        if (fastCodeError) {
          console.error("[build-mapsite] Fast code insert error:", fastCodeError);
        } else {
          issuedFastCode = generatedCode;
          const { error: updateError } = await supabaseAdmin
            .from("build_requests")
            .update({ requested_fast_code: generatedCode })
            .eq("id", requestId);

          if (updateError) {
            console.error("[build-mapsite] Fast code update error:", updateError);
          }
        }
      } catch (fastCodeGenerationError) {
        console.error(
          "[build-mapsite] Fast code generation error:",
          fastCodeGenerationError
        );
      }
    }

    let resolvedMapSiteId = mapsiteId;
    if (mapsiteId) {
      const claimed = await markMapSiteClaimedByBuildRequest({
        mapsiteId,
        buildRequestId: requestId,
        fastCode: issuedFastCode ?? null,
        latitude: hasCoordinates ? parsedLatitude : null,
        longitude: hasCoordinates ? parsedLongitude : null,
        propertyTitle: fields.futurePinLabel.trim() || null,
        propertyAddress:
          fields.streetAddress.trim() ||
          fields.reverseGeocodedAddress.trim() ||
          null,
        propertyDescription: fields.pinWriteup.trim() || null,
        coverImage: fileUrls.picture ?? fileUrls.pinImage ?? null,
      });
      resolvedMapSiteId = claimed?.id ?? mapsiteId;
    } else if (formData.get("claimDemonstration") === "true") {
      const claimed = await markMapSiteClaimedByBuildRequest({
        mapsiteId: DEMO_MAPSITE_ID,
        buildRequestId: requestId,
        fastCode: issuedFastCode ?? null,
        latitude: hasCoordinates ? parsedLatitude : null,
        longitude: hasCoordinates ? parsedLongitude : null,
        propertyTitle: fields.futurePinLabel.trim() || null,
        propertyAddress:
          fields.streetAddress.trim() ||
          fields.reverseGeocodedAddress.trim() ||
          null,
        propertyDescription: fields.pinWriteup.trim() || null,
        coverImage: fileUrls.picture ?? fileUrls.pinImage ?? null,
      });
      resolvedMapSiteId = claimed?.id ?? DEMO_MAPSITE_ID;
    }

    return {
      success: true,
      requestId,
      fastCode: issuedFastCode,
      mapsiteId: resolvedMapSiteId ?? undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[build-mapsite] Submission error:", err);
    return { success: false, error: msg };
  }
}
