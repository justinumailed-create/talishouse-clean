"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import { generateFastCode } from "@/lib/fast-code-generator";
import {
  sendBuildRequestReceived,
  sendFastCodeGenerated,
} from "@/lib/email";

export interface ActionResult {
  success: boolean;
  fastCode?: string;
  error?: string;
}

export interface BuildFields {
  date: string;
  email: string;
  accountType: string;
  fastCode: string;
  homePin: string;
  homeAddress: string;
  homeCity: string;
  homeProvince: string;
  homePostalCode: string;
  homeCountry: string;
  helpPreference: string;
  additionalComments: string;
  consentCommunications: boolean;
  consentData: boolean;
  turnstileToken: string;
}

function validate(fields: BuildFields): string | null {
  if (!fields.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    return "Invalid email format";
  if (!fields.accountType) return "Account type is required";
  if (!fields.fastCode.trim()) return "FAST Code is required";
  if (!fields.homePin.trim()) return "Property PIN is required";
  if (!fields.homeAddress.trim()) return "Home address is required";
  if (!fields.homeCity.trim()) return "Home city is required";
  if (!fields.homeProvince.trim()) return "Home province is required";
  if (!fields.homePostalCode.trim()) return "Home postal code is required";
  if (!fields.consentData) return "Data processing consent is required";
  return null;
}

async function uploadFile(
  requestId: string,
  fieldName: string,
  file: File
): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const path = `${requestId}/${fieldName}-${timestamp}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("mapsite-assets")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(`[build-mapsite] Upload failed for ${fieldName}:`, error);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("mapsite-assets")
      .getPublicUrl(path);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error(`[build-mapsite] Upload error for ${fieldName}:`, err);
    return null;
  }
}

export async function submitBuildRequest(
  formData: FormData
): Promise<ActionResult> {
  const fields: BuildFields = {
    date: (formData.get("date") as string) || "",
    email: (formData.get("email") as string) || "",
    accountType: (formData.get("accountType") as string) || "",
    fastCode: (formData.get("fastCode") as string) || "",
    homePin: (formData.get("homePin") as string) || "",
    homeAddress: (formData.get("homeAddress") as string) || "",
    homeCity: (formData.get("homeCity") as string) || "",
    homeProvince: (formData.get("homeProvince") as string) || "",
    homePostalCode: (formData.get("homePostalCode") as string) || "",
    homeCountry: (formData.get("homeCountry") as string) || "Canada",
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

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const requestId = crypto.randomUUID();

    const fileFields = [
      "picture",
      "logo",
      "ttvMonologuePdf",
      "ttvBackgroundImage",
      "tebWriteUpPdf",
    ] as const;

    const fileUrls: Record<string, string | null> = {};
    for (const fieldName of fileFields) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        fileUrls[fieldName] = await uploadFile(requestId, fieldName, file);
      }
    }

    const tebPictureUrls: string[] = [];
    for (let i = 0; ; i++) {
      const file = formData.get(`tebPicture_${i}`) as File | null;
      if (!file || file.size === 0) break;
      const url = await uploadFile(requestId, `tebPicture_${i}`, file);
      if (url) tebPictureUrls.push(url);
    }

    const buildRequest: Database["public"]["Tables"]["build_requests"]["Insert"] = {
      id: requestId,
      first_name: fields.fastCode.trim(),
      last_name: fields.accountType,
      email: fields.email.trim(),
      phone: "",
      account_type: fields.accountType,
      media_focus: null,
      address: fields.homeAddress.trim(),
      geo_location: [
        fields.homeCity.trim(),
        fields.homeProvince.trim(),
        fields.homePostalCode.trim(),
        fields.homeCountry.trim(),
      ]
        .filter(Boolean)
        .join(", "),
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

    const { data: existingCodes, error: codesError } = await supabaseAdmin
      .from("fast_codes")
      .select("code");

    if (codesError) {
      console.error("[build-mapsite] Failed to fetch existing codes:", codesError);
    }

    const existing = (existingCodes || []).map((r) => r.code);

      let fastCode: string;
      if (fields.fastCode.trim()) {
        const preferred = fields.fastCode.trim().toUpperCase();
        if (existing.includes(preferred)) {
          fastCode = generateFastCode(existing);
        } else {
          fastCode = preferred;
        }
      } else {
        fastCode = generateFastCode(existing);
      }

    const fastCodeRecord: Database["public"]["Tables"]["fast_codes"]["Insert"] = {
      code: fastCode,
      type: "mapsite",
      request_id: requestId,
    };

    const { error: fcError } = await supabaseAdmin
      .from("fast_codes")
      .insert(fastCodeRecord);

    if (fcError) {
      console.error("[build-mapsite] Fast code insert error:", fcError);
    }

    const clientName = fields.fastCode.trim();

    sendBuildRequestReceived({
      to: fields.email.trim(),
      recipientName: clientName,
      requestId,
    }).then((result) => {
      if (!result.sent) {
        console.warn("[build-mapsite] Build request email not sent:", result.error);
      }
    });

    sendFastCodeGenerated({
      to: fields.email.trim(),
      recipientName: clientName,
      fastCode,
      mapsiteUrl: `https://talispros.com/ma/${fastCode}`,
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
        pin_image: fileUrls.ttvBackgroundImage ?? null,
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
        helpPreference: fields.helpPreference,
        additionalComments: fields.additionalComments,
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

    return { success: true, fastCode };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[build-mapsite] Submission error:", err);
    return { success: false, error: msg };
  }
}
