import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions for NorthWake Marine services. Please read carefully before requesting a quote or engaging our marine services.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://northwakemarine.com/terms" },
};

const EFFECTIVE_DATE = "April 17, 2025";
const COMPANY = "NorthWake Marine";
const EMAIL = "info@northwakemarine.com";
const PHONE = "(904) 606-5454";
const LOCATION = "Jacksonville, FL";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By submitting a quote request, scheduling a service, or engaging ${COMPANY} in any capacity, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not submit your information or use our services.`,
  },
  {
    title: "2. Services Provided",
    body: `${COMPANY} provides professional marine services including, but not limited to, exterior and interior boat detailing, ceramic coating application, gel coat restoration, marine transport, captain and crew services, monthly maintenance plans, and full-service yacht management. The scope of each service is agreed upon prior to commencement of work and confirmed in writing via a service quote or work order.`,
  },
  {
    title: "3. Quotes and Pricing",
    body: `All quotes provided by ${COMPANY} are estimates based on the information supplied by the client at the time of inquiry. Final pricing may vary based on actual vessel condition, size, and scope of work determined upon inspection. Any changes to scope will be communicated and approved by the client before additional work is performed. Quotes are valid for 30 days from the date of issue.`,
  },
  {
    title: "4. Scheduling and Cancellations",
    body: `Service appointments are confirmed upon receipt of a signed work order or written approval. Cancellations made with less than 48 hours' notice may be subject to a cancellation fee of up to 25% of the quoted service value. ${COMPANY} reserves the right to reschedule appointments due to weather conditions, equipment issues, or other circumstances beyond our control. We will provide reasonable notice and offer alternative scheduling at no additional cost.`,
  },
  {
    title: "5. Client Responsibilities",
    body: `The client is responsible for ensuring the vessel is accessible and available at the agreed location at the time of service. The client must disclose any known defects, damage, or hazardous conditions affecting the vessel prior to service. ${COMPANY} is not responsible for pre-existing damage, structural deficiencies, or conditions not disclosed at the time of booking. The client is responsible for removing personal belongings, valuables, and sensitive equipment prior to service unless otherwise agreed.`,
  },
  {
    title: "6. Payment Terms",
    body: `Payment is due upon completion of services unless a payment plan has been agreed upon in writing in advance. ${COMPANY} accepts payment via cash, check, and major credit/debit cards. For monthly maintenance plans, payment is due in advance on a recurring monthly basis as specified in the maintenance agreement. Accounts more than 14 days past due may be subject to a late fee of 1.5% per month on the outstanding balance.`,
  },
  {
    title: "7. Satisfaction and Warranty",
    body: `${COMPANY} is committed to delivering professional-grade results. If you are not satisfied with a completed service, you must notify us in writing within 48 hours of service completion. We will assess the concern and, at our discretion, re-perform the affected portion of the service at no charge. This remedy is the sole and exclusive remedy for dissatisfaction with our services. Ceramic coating services include a separate written warranty provided at the time of service completion.`,
  },
  {
    title: "8. Limitation of Liability",
    body: `${COMPANY}'s liability for any claim arising out of services performed shall not exceed the total amount paid by the client for the specific service giving rise to the claim. ${COMPANY} is not liable for indirect, incidental, consequential, or punitive damages of any kind. ${COMPANY} carries general liability insurance; however, we are not responsible for damage resulting from pre-existing conditions, latent defects, or circumstances outside our control.`,
  },
  {
    title: "9. Photography and Marketing",
    body: `${COMPANY} may photograph or video vessels before, during, and after service for quality assurance, documentation, and marketing purposes. By engaging our services, you grant ${COMPANY} a non-exclusive, royalty-free license to use such images and video on our website, social media channels, and marketing materials. Vessel identifying information (registration numbers, hull names) will be obscured upon written request.`,
  },
  {
    title: "10. SMS and Communications Consent",
    body: `By providing your phone number and checking the consent box on our contact form, you agree to receive text messages and phone calls from ${COMPANY} regarding your service inquiries, appointment confirmations, and updates. Message and data rates may apply. You may opt out at any time by replying STOP to any text message or contacting us directly at ${EMAIL}.`,
  },
  {
    title: "11. Privacy",
    body: `${COMPANY} collects personal information (name, email, phone number, vessel details) solely for the purpose of providing services and communicating with clients. We do not sell, rent, or share your personal information with third parties except as required by law or necessary to perform your requested services. All client data is stored securely and retained for a period of no longer than 5 years unless otherwise required.`,
  },
  {
    title: "12. Governing Law",
    body: `These Terms and Conditions are governed by and construed in accordance with the laws of the State of Florida. Any disputes arising under these terms shall be resolved exclusively in the state or federal courts located in Duval County, Florida. You consent to the personal jurisdiction of such courts.`,
  },
  {
    title: "13. Modifications to Terms",
    body: `${COMPANY} reserves the right to update or modify these Terms and Conditions at any time. Changes will be posted on our website with an updated effective date. Continued engagement with our services following any modification constitutes acceptance of the revised terms.`,
  },
  {
    title: "14. Contact",
    body: `If you have any questions regarding these Terms and Conditions, please contact us at ${EMAIL} or by phone at ${PHONE}. Our office is based in ${LOCATION}.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex flex-col gap-4 mb-12 pb-10 border-b border-steel-dark">
            <p className="text-steel text-[10px] tracking-[0.4em] uppercase">Legal</p>
            <h1 className="text-wake text-3xl sm:text-4xl font-bold tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-steel text-xs leading-relaxed">
              Effective Date: <span className="text-steel-light">{EFFECTIVE_DATE}</span>
              &nbsp;·&nbsp; Company: <span className="text-steel-light">{COMPANY}</span>
              &nbsp;·&nbsp; Location: <span className="text-steel-light">{LOCATION}</span>
            </p>
            <p className="text-steel-light text-sm leading-relaxed">
              Please read these Terms and Conditions carefully before requesting a quote
              or engaging {COMPANY} for any marine services. These terms govern the
              relationship between you (the client) and {COMPANY}.
            </p>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-10">
            {sections.map((s) => (
              <article key={s.title} className="flex flex-col gap-3">
                <h2 className="text-wake text-sm font-bold tracking-tight">{s.title}</h2>
                <p className="text-steel text-sm leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>

          {/* Footer nav */}
          <div className="mt-16 pt-10 border-t border-steel-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-steel text-xs">
              Questions? Contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-navy hover:text-wake transition-colors">
                {EMAIL}
              </a>
            </p>
            <Link
              href="/"
              className="text-steel text-xs tracking-[0.25em] uppercase hover:text-wake transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
