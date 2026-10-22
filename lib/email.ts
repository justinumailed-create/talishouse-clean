import { Resend } from "resend";
import {
  buildRequestReceivedHtml,
  ebookCompletedHtml,
  fastCodeGeneratedHtml,
  mapSiteAssignedHtml,
  mapSiteCompletedHtml,
  weeklyMarketingReportHtml,
} from "./email-templates";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "Talishouse <noreply@talishouse.com>";

function getClient(): Resend | null {
  if (!resendApiKey) {
    console.warn("[email] RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }
  return new Resend(resendApiKey);
}

interface SendResult {
  sent: boolean;
  id?: string;
  error?: string;
}

async function send(
  to: string,
  subject: string,
  html: string
): Promise<SendResult> {
  const client = getClient();
  if (!client) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Send error:", error);
      return { sent: false, error: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Exception:", msg);
    return { sent: false, error: msg };
  }
}

export async function sendBuildRequestReceived(params: {
  to: string;
  recipientName: string;
  requestId: string;
}): Promise<SendResult> {
  return send(
    params.to,
    "Your Mapsite Build Request Has Been Received",
    buildRequestReceivedHtml({
      recipientName: params.recipientName,
      requestId: params.requestId,
    })
  );
}

export async function sendFastCodeGenerated(params: {
  to: string;
  recipientName: string;
  fastCode: string;
  mapsiteUrl: string;
}): Promise<SendResult> {
  return send(
    params.to,
    "Your Mapsite FAST Code is Ready",
    fastCodeGeneratedHtml({
      recipientName: params.recipientName,
      fastCode: params.fastCode,
      mapsiteUrl: params.mapsiteUrl,
    })
  );
}

export async function sendMapSiteAssigned(params: {
  to: string;
  recipientName: string;
  clientName: string;
  fastCode: string;
}): Promise<SendResult> {
  return send(
    params.to,
    "New Mapsite Assigned to You",
    mapSiteAssignedHtml({
      recipientName: params.recipientName,
      clientName: params.clientName,
      fastCode: params.fastCode,
    })
  );
}

export async function sendMapSiteCompleted(params: {
  to: string;
  recipientName: string;
  fastCode: string;
  mapsiteUrl: string;
}): Promise<SendResult> {
  return send(
    params.to,
    "Your Mapsite is Complete",
    mapSiteCompletedHtml({
      recipientName: params.recipientName,
      fastCode: params.fastCode,
      mapsiteUrl: params.mapsiteUrl,
    })
  );
}

export async function sendEbookCompleted(params: {
  to: string;
  recipientName: string;
  fastCode: string;
  ebookUrl: string;
}): Promise<SendResult> {
  return send(
    params.to,
    "Your Talisbook™ is Ready",
    ebookCompletedHtml({
      recipientName: params.recipientName,
      fastCode: params.fastCode,
      ebookUrl: params.ebookUrl,
    })
  );
}

export async function sendWeeklyMarketingReport(params: {
  to: string;
  recipientName: string;
  fastCode: string;
  summaryText: string;
}): Promise<SendResult> {
  return send(
    params.to,
    `Weekly Marketing Summary — ${params.fastCode.toUpperCase()}`,
    weeklyMarketingReportHtml({
      recipientName: params.recipientName,
      fastCode: params.fastCode,
      summaryText: params.summaryText,
    })
  );
}

export async function sendOwnershipLearnMoreInquiry(params: {
  recipients: readonly string[];
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  /** Discuss a Project page: project location (Google formatted address). */
  location?: string;
  locationVerified?: boolean;
  channel?: string | null;
}): Promise<SendResult> {
  const phoneLine = params.phone?.trim()
    ? `<p><strong>Phone:</strong> ${escapeHtml(params.phone.trim())}</p>`
    : "";
  const locationLine = params.location?.trim()
    ? `<p><strong>Location:</strong> ${escapeHtml(params.location.trim())}${
        params.locationVerified ? " (Google-recognized)" : ""
      }</p>`
    : "";
  const discuss = params.channel === "discuss-page";
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">${discuss ? "Share a Project Vision" : "Ownership Learn More inquiry"}</h2>
      <p><strong>Topic:</strong> ${escapeHtml(params.topic)}</p>
      <p><strong>Name:</strong> ${escapeHtml(params.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
      ${phoneLine}
      ${locationLine}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(params.message)}</p>
    </div>
  `;
  const client = getClient();
  if (!client) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [...params.recipients],
      replyTo: params.email,
      subject: `${discuss ? "Share a Project Vision" : "Learn More"} — ${params.topic} — ${params.name}`,
      html,
    });
    if (error) {
      console.error("[email] Ownership inquiry send error:", error);
      return { sent: false, error: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Ownership inquiry exception:", msg);
    return { sent: false, error: msg };
  }
}

/** Build Demo created → team notification (where + who follows up). */
export async function sendDemoBuiltNotification(params: {
  recipients: readonly string[];
  code: string;
  propertyTitle: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  mapsiteHref: string;
  country: string | null;
  region: string | null;
  followUp: string | null;
  followUpHasEmail: boolean;
}): Promise<SendResult> {
  const client = getClient();
  if (!client) return { sent: false, error: "RESEND_API_KEY not configured" };
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.talispros.com").replace(/\/$/, "");
  const where = [params.region, params.country].filter(Boolean).join(", ") || "Unknown location";
  const mapsUrl = `https://www.google.com/maps?q=${params.latitude},${params.longitude}`;
  const link = params.mapsiteHref.startsWith("http") ? params.mapsiteHref : `${site}${params.mapsiteHref}`;
  const followUpLine = params.followUp
    ? `<p><strong>Follow-up:</strong> ${escapeHtml(params.followUp)} (${escapeHtml(params.country || "")})${
        params.followUpHasEmail ? "" : " — no email on file for this agent yet; please forward."
      }</p>`
    : `<p><strong>Follow-up:</strong> country not recognized — please assign.</p>`;
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">New Build Demo — ${escapeHtml(where)}</h2>
      <p><strong>Where:</strong> ${escapeHtml(where)}</p>
      <p><strong>Address:</strong> ${escapeHtml(params.streetAddress || "—")}</p>
      <p><strong>Coordinates:</strong> <a href="${mapsUrl}">${params.latitude.toFixed(5)}, ${params.longitude.toFixed(5)}</a></p>
      <p><strong>Listing title:</strong> ${escapeHtml(params.propertyTitle || "—")}</p>
      <p><strong>Demo code:</strong> ${escapeHtml(params.code)}</p>
      ${followUpLine}
      <p><a href="${link}">Open the demo Mapsite</a></p>
    </div>
  `;
  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [...params.recipients],
      subject: `Build Demo created — ${where}`,
      html,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

