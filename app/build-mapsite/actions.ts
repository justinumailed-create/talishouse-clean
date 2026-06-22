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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  accountType: string;
  preferredFastCode: string;
  mapsiteTitle: string;
  mapsiteTagline: string;
  heroType: string;
  mediaFocus: string[];
  futureFeatures: string[];
  comments: string;
}

function validate(fields: BuildFields): string | null {
  if (!fields.firstName.trim()) return "First name is required";
  if (!fields.lastName.trim()) return "Last name is required";
  if (!fields.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    return "Invalid email format";
  if (!fields.phone.trim()) return "Phone number is required";
  if (!fields.province.trim()) return "Province / State is required";
  if (!fields.accountType) return "Account type is required";
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
    firstName: (formData.get("firstName") as string) || "",
    lastName: (formData.get("lastName") as string) || "",
    email: (formData.get("email") as string) || "",
    phone: (formData.get("phone") as string) || "",
    address: (formData.get("address") as string) || "",
    city: (formData.get("city") as string) || "",
    province: (formData.get("province") as string) || "",
    postalCode: (formData.get("postalCode") as string) || "",
    country: (formData.get("country") as string) || "",
    accountType: (formData.get("accountType") as string) || "",
    preferredFastCode: (formData.get("preferredFastCode") as string) || "",
    mapsiteTitle: (formData.get("mapsiteTitle") as string) || "",
    mapsiteTagline: (formData.get("mapsiteTagline") as string) || "",
    heroType: (formData.get("heroType") as string) || "map",
    mediaFocus: JSON.parse((formData.get("mediaFocus") as string) || "[]"),
    futureFeatures: JSON.parse(
      (formData.get("futureFeatures") as string) || "[]"
    ),
    comments: (formData.get("comments") as string) || "",
  };

  const validationError = validate(fields);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const requestId = crypto.randomUUID();

    const fileFields = [
      "profileImage",
      "logoImage",
      "pinImage",
      "monologuePdf",
      "ebookPdf",
    ] as const;

    const fileUrls: Record<string, string | null> = {};
    for (const fieldName of fileFields) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        fileUrls[fieldName] = await uploadFile(requestId, fieldName, file);
      }
    }

    const buildRequest: Database["public"]["Tables"]["build_requests"]["Insert"] = {
      id: requestId,
      first_name: fields.firstName.trim(),
      last_name: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      account_type: fields.accountType,
      media_focus: JSON.stringify(fields.mediaFocus),
      address: fields.address.trim(),
      geo_location: [
        fields.city.trim(),
        fields.province.trim(),
        fields.postalCode.trim(),
        fields.country.trim(),
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
      if (fields.preferredFastCode.trim()) {
        const preferred = fields.preferredFastCode.trim().toUpperCase();
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

    const clientName = fields.firstName.trim();

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

    if (Object.keys(fileUrls).length > 0) {
      const assetRecord: Database["public"]["Tables"]["mapsite_assets"]["Insert"] = {
        request_id: requestId,
        profile_image: fileUrls.profileImage ?? null,
        logo_image: fileUrls.logoImage ?? null,
        pin_image: fileUrls.pinImage ?? null,
        monologue_pdf: fileUrls.monologuePdf ?? null,
        ebook_pdf: fileUrls.ebookPdf ?? null,
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
      details: { fastCode },
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
