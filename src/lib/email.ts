import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const FROM =
  process.env.RESEND_FROM || "Powerhouse <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

export const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/$/, "");

export function emailConfigured(): boolean {
  return resend !== null;
}

export interface SendResult {
  delivered: boolean;
  note: string;
}

export async function sendInvoiceEmail(p: {
  to: string;
  agencyName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  portalUrl: string;
}): Promise<SendResult> {
  if (!resend) {
    return {
      delivered: false,
      note: "Marked as sent. Set RESEND_API_KEY to email clients automatically.",
    };
  }

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#14151a">
    <p style="font-size:15px">Hi,</p>
    <p style="font-size:14px;line-height:1.6">
      ${escapeHtml(p.agencyName)} has issued invoice
      <strong>${escapeHtml(p.invoiceNumber)}</strong> for
      <strong>${escapeHtml(p.amount)}</strong>, due ${escapeHtml(p.dueDate)}.
    </p>
    <p style="margin:24px 0">
      <a href="${p.portalUrl}"
         style="background:#9933ff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600">
        View invoice
      </a>
    </p>
    <p style="font-size:12px;color:#8b909c">
      Or paste this link into your browser:<br>${p.portalUrl}
    </p>
  </div>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: p.to,
      subject: `Invoice ${p.invoiceNumber} from ${p.agencyName}`,
      html,
    });
    if (error) {
      return { delivered: false, note: `Sent, but the email failed: ${error.message}` };
    }
    return { delivered: true, note: `Emailed to ${p.to}` };
  } catch (e) {
    return {
      delivered: false,
      note: `Sent, but the email failed: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }
}

export async function sendInviteEmail(p: {
  to: string;
  agencyName: string;
  role: string;
  inviteUrl: string;
}): Promise<SendResult> {
  if (!resend) {
    return {
      delivered: false,
      note: "Invite created. Copy the link below — or set RESEND_API_KEY to email it.",
    };
  }
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#14151a">
    <p style="font-size:14px;line-height:1.6">
      You've been invited to join <strong>${escapeHtml(p.agencyName)}</strong>
      on Powerhouse as <strong>${escapeHtml(p.role)}</strong>.
    </p>
    <p style="margin:24px 0">
      <a href="${p.inviteUrl}"
         style="background:#9933ff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600">
        Accept invite
      </a>
    </p>
    <p style="font-size:12px;color:#8b909c">Or paste this link:<br>${p.inviteUrl}</p>
  </div>`;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: p.to,
      subject: `You're invited to ${p.agencyName}`,
      html,
    });
    if (error) return { delivered: false, note: `Invite created, email failed: ${error.message}` };
    return { delivered: true, note: `Invite emailed to ${p.to}` };
  } catch (e) {
    return {
      delivered: false,
      note: `Invite created, email failed: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}
