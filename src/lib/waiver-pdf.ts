import PDFDocument from "pdfkit";
import { SECTIONS } from "./waiver-sections";

export type WaiverData = {
  name: string;
  address: string;
  phone: string;
  email: string;
  boat: string;
  date: string;
  signature: string;
};

// Flattens a rich paragraph into plain text for PDF rendering.
function richParaToText(segs: { text: string; bold?: boolean }[]): string {
  return segs.map((s) => s.text).join("");
}

export function generateWaiverPdf(data: WaiverData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const navy = "#000080";
    const black = "#000000";
    const gray = "#686A6C";
    const lightGray = "#E5E7EB";

    // Header bar
    doc.rect(0, 0, doc.page.width, 60).fill(navy);
    doc
      .fillColor("#FFFFFF")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("NorthWake Marine", 50, 18);
    doc
      .fillColor("rgba(255,255,255,0.6)")
      .fontSize(8)
      .font("Helvetica")
      .text("JACKSONVILLE, FL  |  ESTABLISHED 2025", 50, 36);

    doc.moveDown(3);

    // Document title
    doc
      .fillColor(black)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("General Liability Waiver & Service Agreement", 50, doc.y);

    doc.moveDown(0.4);
    doc
      .fillColor(gray)
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Please review all terms carefully. This document constitutes a legally binding agreement.",
        50,
        doc.y
      );

    // Divider
    doc.moveDown(0.8);
    doc.rect(50, doc.y, doc.page.width - 100, 1).fill(lightGray);
    doc.moveDown(0.6);

    // Customer info box
    const infoTop = doc.y;
    doc
      .rect(50, infoTop, doc.page.width - 100, 130)
      .fillAndStroke("#F9FAFB", lightGray);

    doc
      .fillColor(gray)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("CUSTOMER INFORMATION", 62, infoTop + 12);

    const col1 = 62;
    const col2 = doc.page.width / 2 + 10;
    const labelY = infoTop + 26;

    const row = (label: string, value: string, x: number, y: number) => {
      doc.fillColor(gray).fontSize(7.5).font("Helvetica-Bold").text(label, x, y);
      doc
        .fillColor(black)
        .fontSize(9)
        .font("Helvetica")
        .text(value || "(not provided)", x, y + 11, { width: 200 });
    };

    row("Full Name", data.name, col1, labelY);
    row("Email Address", data.email, col2, labelY);
    row("Phone Number", data.phone, col1, labelY + 38);
    row("Address", data.address, col2, labelY + 38);
    row("Vessel / Boat", data.boat, col1, labelY + 76);

    doc.y = infoTop + 140;
    doc.moveDown(0.8);

    // Agreement Terms heading
    doc
      .fillColor(gray)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("AGREEMENT TERMS", 50, doc.y);
    doc.moveDown(0.5);

    // Render each section
    for (const section of SECTIONS) {
      // Check if we're near the bottom of the page; add a new page if needed
      if (doc.y > doc.page.height - 120) doc.addPage();

      // Section heading
      doc
        .fillColor(navy)
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .text(`${section.num}. ${section.title}`, 50, doc.y);
      doc.moveDown(0.3);

      if (section.body) {
        for (const para of section.body.split("\n\n")) {
          if (doc.y > doc.page.height - 100) doc.addPage();
          doc
            .fillColor("#374151")
            .fontSize(8.5)
            .font("Helvetica")
            .text(para.trim(), 50, doc.y, { width: doc.page.width - 100 });
          doc.moveDown(0.35);
        }
      }

      if (section.bullets) {
        for (const bullet of section.bullets) {
          if (doc.y > doc.page.height - 80) doc.addPage();
          doc
            .fillColor("#374151")
            .fontSize(8.5)
            .font("Helvetica")
            .text(`•  ${bullet}`, 62, doc.y, { width: doc.page.width - 112 });
          doc.moveDown(0.25);
        }
      }

      if (section.footer) {
        doc.moveDown(0.15);
        for (const para of section.footer.split("\n\n")) {
          if (doc.y > doc.page.height - 100) doc.addPage();
          doc
            .fillColor("#374151")
            .fontSize(8.5)
            .font("Helvetica")
            .text(para.trim(), 50, doc.y, { width: doc.page.width - 100 });
          doc.moveDown(0.35);
        }
      }

      if (section.paragraphs) {
        for (const segs of section.paragraphs) {
          if (doc.y > doc.page.height - 80) doc.addPage();
          const text = richParaToText(segs);
          doc
            .fillColor("#374151")
            .fontSize(8.5)
            .font("Helvetica")
            .text(text, 50, doc.y, { width: doc.page.width - 100 });
          doc.moveDown(0.35);
        }
      }

      // Section separator
      doc.moveDown(0.25);
      doc.rect(50, doc.y, doc.page.width - 100, 0.5).fill(lightGray);
      doc.moveDown(0.6);
    }

    // Signature block
    if (doc.y > doc.page.height - 160) doc.addPage();
    doc.moveDown(0.5);

    doc
      .fillColor(gray)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("ELECTRONIC SIGNATURE & ACKNOWLEDGMENT", 50, doc.y);
    doc.moveDown(0.5);

    const sigTop = doc.y;
    doc
      .rect(50, sigTop, doc.page.width - 100, 100)
      .fillAndStroke("#F9FAFB", lightGray);

    doc
      .fillColor(gray)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("Digital Signature (Full Legal Name)", 62, sigTop + 12);
    doc
      .fillColor(navy)
      .fontSize(14)
      .font("Helvetica-BoldOblique")
      .text(data.signature, 62, sigTop + 26, { width: doc.page.width - 124 });

    doc
      .fillColor(gray)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text("Date Signed", 62, sigTop + 60);
    doc
      .fillColor(black)
      .fontSize(9)
      .font("Helvetica")
      .text(data.date, 62, sigTop + 72);

    doc.y = sigTop + 110;
    doc.moveDown(0.5);

    doc
      .fillColor(gray)
      .fontSize(7.5)
      .font("Helvetica")
      .text(
        "By submitting this form, the customer has read, understood, and agreed to all terms above. " +
          "This agreement is governed by the laws of the State of Florida.",
        50,
        doc.y,
        { width: doc.page.width - 100 }
      );

    // Footer on last page
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, doc.page.width, 40).fill(navy);
    doc
      .fillColor("rgba(255,255,255,0.5)")
      .fontSize(7.5)
      .font("Helvetica")
      .text(
        `NorthWake Marine  |  Jacksonville, FL  |  northwakemarine.com  |  Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        50,
        footerY + 14,
        { width: doc.page.width - 100, align: "center" }
      );

    doc.end();
  });
}
