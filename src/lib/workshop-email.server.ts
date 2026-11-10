import { NEURAL_NETWORK_WORKSHOP as event } from "@/data/neural-network-workshop";
import nodemailer from "nodemailer";
import QRCode from "qrcode";

type WorkshopPassEmail = {
  name: string;
  email: string;
  passUrl: string;
  code: string;
};

type WorkshopRegistrationEmail = {
  name: string;
  email: string;
  registrationId: string;
};

const WORKSHOP_CALENDAR_URL = (() => {
  const calendar = new URL("https://calendar.google.com/calendar/render");
  calendar.searchParams.set("action", "TEMPLATE");
  calendar.searchParams.set("text", "Neural Networks from Scratch · Vertex Club");
  calendar.searchParams.set(
    "dates",
    [event.startsAt, event.endsAt]
      .map((value) => new Date(value).toISOString().replace(/[-:]/g, "").replace(".000", ""))
      .join("/"),
  );
  calendar.searchParams.set(
    "details",
    "Neural Networks from Scratch workshop by Vertex Club at REVA University. Registration is subject to approval; your QR pass will arrive by email after approval.",
  );
  calendar.searchParams.set("location", event.venue);
  return calendar.toString();
})();

/** Send a durable, non-pass receipt after a registration is saved as pending. */
export async function sendWorkshopRegistrationEmail(
  registration: WorkshopRegistrationEmail,
): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  const message = {
    from,
    to: [registration.email],
    subject: "Registration received · Neural Networks from Scratch",
    html: renderRegistrationEmail(registration),
    text: `Vertex Club · REVA University\n\nHi ${registration.name},\n\nWe received your registration for Neural Networks from Scratch. Its current status is pending approval.\n\nWhen: ${event.date} · ${event.time} IST\nWhere: ${event.venue}\n\nThe Vertex team will review your application. If approved, your QR entry pass will be sent to this email address. This receipt is not an entry pass.\n\nAdd the workshop to your calendar: ${WORKSHOP_CALENDAR_URL}\n\nNeed help? Reply to this email.\n\nVertex Club · Technical partner Abscissa`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `nn-workshop-registration-receipt-${registration.registrationId}`,
        },
        body: JSON.stringify({ ...message, reply_to: replyTo }),
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      console.error(
        "Resend workshop registration receipt failed; trying SMTP fallback",
        await response.text(),
      );
      // A server error may follow an accepted send, so avoid a second copy
      // through SMTP when Resend's result is ambiguous.
      if (response.status >= 500) return false;
    } catch (error) {
      // A timeout is ambiguous: Resend may have accepted the message. Do not
      // fall back to SMTP and risk delivering a duplicate receipt.
      console.error("Could not confirm Resend workshop registration receipt", error);
      return false;
    }
  }

  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  if (!from || !smtpUser || !smtpPass) return false;

  try {
    const transport = nodemailer.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: Number(process.env["SMTP_PORT"] || "465"),
      secure: process.env["SMTP_SECURE"] !== "false",
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transport.sendMail({ ...message, from: process.env["SMTP_FROM_EMAIL"] || from, replyTo });
    return true;
  } catch (error) {
    console.error("Workshop registration receipt email failed", error);
    return false;
  }
}

/**
 * Send through Resend when it has a verified sender, otherwise through the
 * dedicated event Gmail account. Passes are sent only after an event manager
 * has approved the registration; an administrator can resend them later.
 */
export async function sendWorkshopPassEmail(pass: WorkshopPassEmail): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["EVENTS_FROM_EMAIL"];
  const replyTo = process.env["EVENTS_REPLY_TO"];
  // The web pass is useful to a participant, but it is a poor scanner payload:
  // it produces a dense QR in Gmail and can be changed by URL rewriting. The
  // door scanner and web pass both use this same short, non-personal pass code.
  const qrContent = await QRCode.toBuffer(pass.code, {
    type: "png",
    errorCorrectionLevel: "Q",
    margin: 2,
    width: 640,
    color: { dark: "#111827", light: "#ffffff" },
  });
  const qrBase64 = qrContent.toString("base64");
  const message = {
    from,
    to: [pass.email],
    subject: "Your approved entry pass · Neural Networks from Scratch",
    html: renderPassEmail(pass),
    text: `Vertex Club · REVA University\n\nHi ${pass.name}, your registration for Neural Networks from Scratch has been approved.\n\nYour QR is included in the HTML version of this email. Show it at the Vertex desk for check-in.\n\nWhen: ${event.date} · ${event.time} IST\nWhere: ${event.venue}\n\nOpen your pass: ${pass.passUrl}\nBackup pass code: ${pass.code}\n\nKeep this email available on event day.`,
  };

  if (apiKey && from) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...message,
          reply_to: replyTo,
          attachments: [
            {
              filename: "vertex-entry-pass.png",
              content: qrBase64,
              content_type: "image/png",
              content_id: "vertex-entry-pass",
            },
          ],
        }),
      });
      if (response.ok) return true;
      console.error(
        "Resend workshop pass delivery failed; trying SMTP fallback",
        await response.text(),
      );
    } catch (error) {
      console.error("Resend workshop pass delivery failed; trying SMTP fallback", error);
    }
  }

  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];
  if (!from || !smtpUser || !smtpPass) return false;

  try {
    const transport = nodemailer.createTransport({
      host: process.env["SMTP_HOST"] || "smtp.gmail.com",
      port: Number(process.env["SMTP_PORT"] || "465"),
      secure: process.env["SMTP_SECURE"] !== "false",
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transport.sendMail({
      ...message,
      from: process.env["SMTP_FROM_EMAIL"] || from,
      replyTo,
      attachments: [
        {
          filename: "vertex-entry-pass.png",
          content: qrContent,
          contentType: "image/png",
          cid: "vertex-entry-pass",
          contentDisposition: "inline",
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Workshop pass email failed", error);
    return false;
  }
}

function renderPassEmail(pass: WorkshopPassEmail) {
  const safeUrl = escapeHtml(pass.passUrl);
  const siteUrl = escapeHtml(new URL(pass.passUrl).origin);
  return `<!doctype html>
    <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your Vertex entry pass</title></head>
    <body style="margin:0;padding:0;background:#f3f4f6;color:#172033;font-family:Arial,Helvetica,sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6"><tr><td align="center" style="padding:28px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d9dee8;border-radius:18px;overflow:hidden">
          <tr><td style="padding:22px 28px;border-top:5px solid #173f2d;border-bottom:1px solid #e5e7eb">
            <img src="${siteUrl}/vertex-logo-transparent.png" width="132" height="44" alt="Vertex Club" style="display:block;width:132px;height:auto;border:0" />
            <div style="padding-top:14px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#5d6a62">Vertex Club · REVA University</div>
            <div style="padding-top:8px;font-size:28px;line-height:34px;font-weight:700;color:#172033">Your entry pass is ready.</div>
          </td></tr>
          <tr><td style="padding:28px">
            <p style="margin:0 0 10px;font-size:16px;line-height:24px">Hi ${escapeHtml(pass.name)},</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#4b5563">Your registration for <strong style="color:#172033">Neural Networks from Scratch</strong> has been approved. Show the QR below at the Vertex desk.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9dee8;border-radius:12px;background:#f8faf9"><tr><td style="padding:18px 20px">
              <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#5d6a62">Event details</div>
              <div style="padding-top:7px;font-size:16px;line-height:24px;font-weight:700">${event.date} · ${event.time} IST</div>
              <div style="font-size:15px;line-height:23px;color:#4b5563">${event.venue}</div>
            </td></tr></table>
            <div style="padding:28px 0 10px;text-align:center">
              <img src="cid:vertex-entry-pass" width="240" height="240" alt="QR code for ${escapeHtml(pass.name)}'s Vertex entry pass" style="display:block;width:240px;height:240px;margin:0 auto;border:0;background:#ffffff" />
            </div>
            <p style="margin:8px 0 24px;text-align:center;font-size:13px;line-height:20px;color:#5d6a62">This is your check-in QR. Keep this email open or take a screenshot before you arrive.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td style="border-radius:8px;background:#172033">
              <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Open web pass</a>
            </td></tr></table>
            <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;line-height:19px;color:#6b7280">Backup pass code: <strong style="color:#172033">${escapeHtml(pass.code)}</strong><br/>The QR contains no personal information. Need help? Reply to this email.</p>
          </td></tr>
          <tr><td style="padding:18px 28px;background:#f8faf9;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
            Sent by Vertex Club · Technical partner <a href="https://abscissa.dev" style="color:#173f2d;font-weight:700;text-decoration:none">Abscissa</a>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
}

function renderRegistrationEmail(registration: WorkshopRegistrationEmail) {
  const siteUrl = escapeHtml(process.env["SITE_URL"] || "https://vertex-club.vercel.app");
  const calendarUrl = escapeHtml(WORKSHOP_CALENDAR_URL);
  return `<!doctype html>
    <html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Registration received · Vertex Club</title></head>
    <body style="margin:0;padding:0;background:#f3f4f6;color:#172033;font-family:Arial,Helvetica,sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6"><tr><td align="center" style="padding:28px 16px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d9dee8;border-radius:18px;overflow:hidden">
          <tr><td style="padding:22px 28px;border-top:5px solid #173f2d;border-bottom:1px solid #e5e7eb">
            <img src="${siteUrl}/vertex-logo-transparent.png" width="132" alt="Vertex Club" style="display:block;width:132px;height:auto;border:0" />
            <div style="padding-top:14px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#5d6a62">Vertex Club · REVA University</div>
            <div style="padding-top:8px;font-size:26px;line-height:32px;font-weight:700;color:#172033">Your application is received.</div>
          </td></tr>
          <tr><td style="padding:28px">
            <p style="margin:0 0 10px;font-size:16px;line-height:24px">Hi ${escapeHtml(registration.name)},</p>
            <p style="margin:0 0 22px;font-size:16px;line-height:24px;color:#4b5563">Your registration for <strong style="color:#172033">Neural Networks from Scratch</strong> is saved and waiting for review.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9dee8;border-radius:12px;background:#f8faf9"><tr><td style="padding:18px 20px">
              <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#5d6a62">Pending approval</div>
              <div style="padding-top:7px;font-size:16px;line-height:24px;font-weight:700">${event.date} · ${event.time} IST</div>
              <div style="font-size:15px;line-height:23px;color:#4b5563">${event.venue}</div>
            </td></tr></table>
            <p style="margin:22px 0;font-size:15px;line-height:23px;color:#4b5563">The Vertex team will review your application. If approved, your QR entry pass will be sent to <strong style="color:#172033">${escapeHtml(registration.email)}</strong>. This receipt is not an entry pass.</p>
            <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:8px;background:#173f2d">
              <a href="${calendarUrl}" style="display:inline-block;min-height:44px;padding:13px 20px;color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none">Add to Google Calendar</a>
            </td></tr></table>
            <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e5e7eb;font-size:13px;line-height:20px;color:#6b7280">Need help? Reply to this email. We’ll send another email if your application is approved.</p>
          </td></tr>
          <tr><td style="padding:18px 28px;background:#f8faf9;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
            Sent by Vertex Club · Technical partner <a href="https://abscissa.dev" style="color:#173f2d;font-weight:700;text-decoration:none">Abscissa</a>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!,
  );
}
