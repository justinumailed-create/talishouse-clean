interface BaseEmailProps {
  recipientName: string;
}

interface BuildRequestReceivedProps extends BaseEmailProps {
  requestId: string;
}

interface FastCodeGeneratedProps extends BaseEmailProps {
  fastCode: string;
  mapsiteUrl: string;
}

interface MapSiteAssignedProps extends BaseEmailProps {
  clientName: string;
  fastCode: string;
}

interface MapSiteCompletedProps extends BaseEmailProps {
  fastCode: string;
  mapsiteUrl: string;
}

interface WeeklyMarketingReportProps extends BaseEmailProps {
  fastCode: string;
  summaryText: string;
}

function wrap(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f7;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:40px 32px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;border-bottom:1px solid #e5e5e5">
                    <h1 style="margin:0;font-size:18px;font-weight:600;color:#111;letter-spacing:-0.3px">
                      Talishouse
                    </h1>
                  </td>
                </tr>
                ${content}
                <tr>
                  <td style="padding-top:24px;border-top:1px solid #e5e5e5;text-align:center">
                    <p style="margin:0;font-size:12px;color:#8e8e93">
                      Talishouse Inc. &middot; Building better MapSites
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildRequestReceivedHtml({ recipientName, requestId }: BuildRequestReceivedProps) {
  return wrap(`
    <tr>
      <td style="padding-top:24px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;letter-spacing:-0.3px">
          Build Request Received
        </h2>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Hi ${recipientName},
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Thank you for submitting your MapSite build request. Our team has received it and will review it within two business days.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Once reviewed, you will receive a FAST code that grants you access to your MapSite.
        </p>
        <table cellpadding="0" cellspacing="0" style="background-color:#f5f5f7;border-radius:10px;padding:16px;margin-bottom:16px">
          <tr>
            <td>
              <p style="margin:0;font-size:12px;color:#8e8e93;text-transform:uppercase;letter-spacing:0.5px">
                Request ID
              </p>
              <p style="margin:4px 0 0;font-size:14px;color:#111;font-weight:500;font-family:monospace">
                ${requestId.slice(0, 8)}…
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:13px;color:#8e8e93">
          If you have any questions, reply to this email or contact our support team.
        </p>
      </td>
    </tr>
  `);
}

export function fastCodeGeneratedHtml({ recipientName, fastCode, mapsiteUrl }: FastCodeGeneratedProps) {
  return wrap(`
    <tr>
      <td style="padding-top:24px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;letter-spacing:-0.3px">
          Your FAST Code is Ready
        </h2>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Hi ${recipientName},
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Great news! Your MapSite FAST code has been generated. This code is your key to accessing and sharing your MapSite.
        </p>
        <table cellpadding="0" cellspacing="0" style="background-color:#f0f4ff;border-radius:12px;padding:20px;margin-bottom:16px">
          <tr>
            <td align="center">
              <p style="margin:0 0 4px;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:0.5px">
                Your FAST Code
              </p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#1d4ed8;letter-spacing:2px;font-family:monospace">
                ${fastCode}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Access your MapSite anytime at the link below:
        </p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#111;border-radius:10px;padding:12px 24px">
              <a href="${mapsiteUrl}" style="color:#fff;text-decoration:none;font-size:14px;font-weight:500;display:inline-block">
                View My MapSite
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#8e8e93">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${mapsiteUrl}" style="color:#1d4ed8;font-size:13px">${mapsiteUrl}</a>
        </p>
      </td>
    </tr>
  `);
}

export function mapSiteAssignedHtml({ recipientName, clientName, fastCode }: MapSiteAssignedProps) {
  return wrap(`
    <tr>
      <td style="padding-top:24px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;letter-spacing:-0.3px">
          New MapSite Assigned
        </h2>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Hi ${recipientName},
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          A new MapSite build request has been assigned to you.
        </p>
        <table cellpadding="0" cellspacing="0" style="background-color:#f5f5f7;border-radius:10px;padding:16px;margin-bottom:16px">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:8px">
                    <p style="margin:0;font-size:12px;color:#8e8e93;text-transform:uppercase;letter-spacing:0.5px">Client</p>
                    <p style="margin:2px 0 0;font-size:14px;color:#111;font-weight:500">${clientName}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#8e8e93;text-transform:uppercase;letter-spacing:0.5px">FAST Code</p>
                    <p style="margin:2px 0 0;font-size:14px;color:#111;font-weight:500;font-family:monospace">${fastCode}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.5">
          Please log in to your associate dashboard to review the details and begin working on this request.
        </p>
      </td>
    </tr>
  `);
}

export function mapSiteCompletedHtml({ recipientName, fastCode, mapsiteUrl }: MapSiteCompletedProps) {
  return wrap(`
    <tr>
      <td style="padding-top:24px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;letter-spacing:-0.3px">
          Your MapSite is Complete
        </h2>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Hi ${recipientName},
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Your MapSite is ready! You can now view and share it using your FAST code.
        </p>
        <table cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:16px">
          <tr>
            <td align="center">
              <p style="margin:0 0 4px;font-size:12px;color:#555;text-transform:uppercase;letter-spacing:0.5px">
                FAST Code
              </p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#16a34a;letter-spacing:2px;font-family:monospace">
                ${fastCode}
              </p>
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#111;border-radius:10px;padding:12px 24px">
              <a href="${mapsiteUrl}" style="color:#fff;text-decoration:none;font-size:14px;font-weight:500;display:inline-block">
                View My MapSite
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:13px;color:#8e8e93">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${mapsiteUrl}" style="color:#1d4ed8;font-size:13px">${mapsiteUrl}</a>
        </p>
      </td>
    </tr>
  `);
}

export function weeklyMarketingReportHtml({
  recipientName,
  fastCode,
  summaryText,
}: WeeklyMarketingReportProps) {
  return wrap(`
    <tr>
      <td style="padding-top:24px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;letter-spacing:-0.3px">
          Weekly Marketing Summary
        </h2>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Hi ${recipientName},
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.5">
          Here is your weekly performance summary for FAST Code ${fastCode.toUpperCase()}.
        </p>
        <table cellpadding="0" cellspacing="0" style="background-color:#f5f5f7;border-radius:10px;padding:16px;margin-bottom:16px">
          <tr>
            <td>
              <p style="margin:0;font-size:15px;color:#111;line-height:1.6">
                ${summaryText}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:13px;color:#8e8e93">
          Sign in to your client analytics dashboard anytime for the full breakdown.
        </p>
      </td>
    </tr>
  `);
}
