import { Resend } from "resend";
import {
  buildRequestReceivedHtml,
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
    "Your MapSite Build Request Has Been Received",
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
    "Your MapSite FAST Code is Ready",
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
    "New MapSite Assigned to You",
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
    "Your MapSite is Complete",
    mapSiteCompletedHtml({
      recipientName: params.recipientName,
      fastCode: params.fastCode,
      mapsiteUrl: params.mapsiteUrl,
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
