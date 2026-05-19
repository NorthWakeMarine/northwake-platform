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
