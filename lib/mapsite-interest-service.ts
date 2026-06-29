"use server";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface SubmitMapSiteInterestResult {
  success: boolean;
  error?: string;
}

function getLeadsClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function submitMapSiteInterest(
  formData: FormData
): Promise<SubmitMapSiteInterestResult> {
  const fastCode = (formData.get("fastCode") as string)?.trim();
  const inquiryDate = (formData.get("inquiryDate") as string)?.trim();
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const countryCode = (formData.get("countryCode") as string)?.trim() || "+1";
  const mobile = (formData.get("mobile") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();
  const attachment = formData.get("attachment") as File | null;

  if (!fastCode || !inquiryDate || !firstName || !lastName || !email) {
    return { success: false, error: "Please complete all required fields." };
  }

  let attachmentUrl: string | null = null;

  if (attachment && attachment.size > 0) {
    const supabase = getSupabaseAdmin();
    const ext = attachment.name.split(".").pop() || "bin";
    const path = `lead-attachments/${fastCode.toLowerCase()}/${Date.now()}-${firstName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("mapsite-assets")
      .upload(path, attachment, {
        contentType: attachment.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[mapsite-interest] Attachment upload failed:", uploadError);
      return { success: false, error: "Failed to upload attachment." };
    }

    const { data } = supabase.storage.from("mapsite-assets").getPublicUrl(path);
    attachmentUrl = data?.publicUrl || null;
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const phone = mobile ? `${countryCode} ${mobile}` : countryCode;
  const composedMessage = [
    `Date: ${inquiryDate}`,
    subject ? `Subject: ${subject}` : null,
    message ? `Message: ${message}` : null,
    attachmentUrl ? `Attachment: ${attachmentUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const supabase = getLeadsClient();
  const { error } = await supabase.from("leads").insert([
    {
      name: fullName,
      email,
      phone,
      message: composedMessage,
      location: `MapSite ${fastCode}`,
      fast_code: fastCode,
      source: "mapsite_interest_form",
      status: "new",
    },
  ]);

  if (error) {
    console.error("[mapsite-interest] Lead insert failed:", error);
    return { success: false, error: "Failed to submit your interest." };
  }

  return { success: true };
}
