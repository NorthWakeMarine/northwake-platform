import { Resend } from "resend";
import { clientConfig } from "@/config/client";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendLeadNotification(lead: {
  name: string;
  email: string | null;
  phone: string | null;
  service: string | null;
  vesselType: string | null;
  message: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const lines = [
    `Name: ${lead.name}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.service ? `Service: ${lead.service}` : null,
    lead.vesselType ? `Vessel: ${lead.vesselType}` : null,
    lead.message ? `\nMessage:\n${lead.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await resend.emails.send({
    from: `${clientConfig.companyName} CRM <crm@northwakemarine.com>`,
    to: "admin@northwakemarine.com",
    subject: `New Website Lead: ${lead.name}`,
    text: `New lead from the website form.\n\n${lines}\n\nView in CRM: ${clientConfig.crmUrl}/leads`,
  });

  if (error) throw new Error(error.message);
}

export async function sendTeamInviteEmail(invite: {
  email: string;
  fullName: string;
  inviteUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: `${clientConfig.companyName} <info@northwakemarine.com>`,
    to: invite.email,
    subject: `You've been invited to ${clientConfig.proPortalName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <div style="background:#000080;padding:20px 24px;margin-bottom:28px;">
          <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0;letter-spacing:1px;">${clientConfig.companyName.toUpperCase()}</p>
          <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:4px 0 0;letter-spacing:3px;">PRO PORTAL</p>
        </div>
        <h1 style="font-size:20px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">You're invited, ${invite.fullName.split(" ")[0]}.</h1>
        <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 28px;">
          You've been added to the ${clientConfig.companyName} operations team. Click the button below to set your password and access the portal.
        </p>
        <a href="${invite.inviteUrl}" style="display:inline-block;background:#000080;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;margin-bottom:28px;">
          Accept Invite
        </a>
        <p style="font-size:11px;color:#9ca3af;line-height:1.6;margin:0 0 4px;">
          This link expires in 24 hours. If you did not expect this invitation, you can ignore this email.
        </p>
        <p style="font-size:11px;color:#d1d5db;margin:0;">
          Or copy this link: <span style="color:#6b7280;">${invite.inviteUrl}</span>
        </p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
}

export async function sendWaiverCompletionNotification(waiver: {
  name: string;
  email: string;
  phone: string;
  address: string;
  boat: string;
  contactId: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const lines = [
    `Name:    ${waiver.name}`,
    `Email:   ${waiver.email}`,
    `Phone:   ${waiver.phone}`,
    `Address: ${waiver.address}`,
    `Vessel:  ${waiver.boat}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: `${clientConfig.companyName} CRM <crm@northwakemarine.com>`,
    to: "admin@northwakemarine.com",
    subject: `Waiver Signed: ${waiver.name}`,
    text: `A liability waiver has been completed.\n\n${lines}\n\nView contact: ${clientConfig.crmUrl}/contacts/${waiver.contactId}`,
  });

  if (error) throw new Error(error.message);
}
