import nodemailer from "nodemailer";
import { clientConfig } from "@/config/client";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendLeadNotification(lead: {
  name: string;
  email: string | null;
  phone: string | null;
  service: string | null;
  vesselType: string | null;
  message: string | null;
}): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const to = process.env.GMAIL_USER!;
  const lines = [
    `Name: ${lead.name}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.service ? `Service: ${lead.service}` : null,
    lead.vesselType ? `Vessel: ${lead.vesselType}` : null,
    lead.message ? `\nMessage:\n${lead.message}` : null,
  ].filter(Boolean).join("\n");

  await transport.sendMail({
    from: `"${clientConfig.companyName} CRM" <${to}>`,
    to,
    subject: `New Website Lead: ${lead.name}`,
    text: `New lead from the website form.\n\n${lines}\n\nView in CRM: ${clientConfig.crmUrl}/leads`,
  });
}
