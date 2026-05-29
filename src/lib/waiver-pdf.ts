import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

const NAVY  = rgb(0,    0,    0.502); // #000080
const BLACK = rgb(0,    0,    0);
const GRAY  = rgb(0.412, 0.416, 0.424); // #686A6C
const BODY  = rgb(0.216, 0.255, 0.318); // #374151
const LGRAY = rgb(0.898, 0.906, 0.922); // #E5E7EB
const WHITE = rgb(1, 1, 1);
const BGRAY = rgb(0.976, 0.980, 0.988); // #F9FAFB

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

function wordWrap(text: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n\n")) {
    const words = paragraph.replace(/\n/g, " ").split(" ");
    let line = "";
    for (const word of words) {
      if ((line + " " + word).trim().length > charsPerLine) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) lines.push(line);
    lines.push(""); // paragraph break
  }
  return lines;
}

export async function generateWaiverPdf(data: WaiverData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const boldObl = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H; // current cursor (top-down, but pdf-lib uses bottom-up coords)

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - 50;
  };

  const need = (space: number) => {
    if (y - space < 60) addPage();
  };

  const drawText = (
    text: string,
    opts: {
      size: number;
      font: typeof regular;
      color?: typeof BLACK;
      x?: number;
      width?: number;
      lineHeight?: number;
    }
  ) => {
    const {
      size,
      font,
      color = BLACK,
      x = MARGIN,
      width = CONTENT_W,
      lineHeight,
    } = opts;
    const lh = lineHeight ?? size * 1.35;
    const charsPerLine = Math.floor(width / (size * 0.52));
    const wrapped = wordWrap(text, charsPerLine);
    for (const line of wrapped) {
      if (line === "") {
        y -= size * 0.5;
        continue;
      }
      need(lh);
      page.drawText(line, { x, y: y - size, size, font, color });
      y -= lh;
    }
    return wrapped.length;
  };

  // ── Header bar ──────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: NAVY });
  page.drawText("NorthWake Marine", { x: MARGIN, y: PAGE_H - 28, size: 14, font: bold, color: WHITE });
  page.drawText("JACKSONVILLE, FL  |  ESTABLISHED 2025", { x: MARGIN, y: PAGE_H - 46, size: 7.5, font: regular, color: rgb(1,1,1) });
  y = PAGE_H - 72;

  // ── Title ────────────────────────────────────────────────────────
  y -= 6;
  page.drawText("General Liability Waiver & Service Agreement", { x: MARGIN, y: y - 18, size: 17, font: bold, color: BLACK });
  y -= 26;
  page.drawText(
    "Please review all terms carefully. This document constitutes a legally binding agreement.",
    { x: MARGIN, y: y - 9, size: 8.5, font: regular, color: GRAY }
  );
  y -= 18;

  // Divider
  page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: PAGE_W - MARGIN, y: y - 4 }, thickness: 0.75, color: LGRAY });
  y -= 16;

  // ── Customer info box ─────────────────────────────────────────────
  const BOX_H = 128;
  page.drawRectangle({ x: MARGIN, y: y - BOX_H, width: CONTENT_W, height: BOX_H, color: BGRAY, borderColor: LGRAY, borderWidth: 0.75 });

  page.drawText("CUSTOMER INFORMATION", { x: MARGIN + 12, y: y - 16, size: 7, font: bold, color: GRAY });

  const col1 = MARGIN + 12;
  const col2 = PAGE_W / 2 + 10;

  const infoField = (label: string, value: string, x: number, topY: number) => {
    page.drawText(label, { x, y: topY - 12, size: 7, font: bold, color: GRAY });
    page.drawText(value || "(not provided)", { x, y: topY - 24, size: 9, font: regular, color: BLACK });
  };

  const r1 = y - 26;
  const r2 = y - 64;
  const r3 = y - 100;

  infoField("Full Name",        data.name,    col1, r1);
  infoField("Email Address",    data.email,   col2, r1);
  infoField("Phone Number",     data.phone,   col1, r2);
  infoField("Address",          data.address, col2, r2);
  infoField("Vessel / Boat",    data.boat,    col1, r3);

  y -= BOX_H + 16;

  // ── Agreement Terms heading ───────────────────────────────────────
  page.drawText("AGREEMENT TERMS", { x: MARGIN, y, size: 7, font: bold, color: GRAY });
  y -= 14;

  // ── Sections ──────────────────────────────────────────────────────
  for (const section of SECTIONS) {
    need(30);

    // Section heading
    page.drawText(`${section.num}. ${section.title}`, { x: MARGIN, y: y - 8, size: 9.5, font: bold, color: NAVY });
    y -= 14;

    if (section.body) {
      drawText(section.body, { size: 8.5, font: regular, color: BODY });
      y -= 2;
    }

    if (section.bullets) {
      for (const bullet of section.bullets) {
        need(14);
        drawText(`•  ${bullet}`, { size: 8.5, font: regular, color: BODY, x: MARGIN + 10, width: CONTENT_W - 10 });
        y -= 1;
      }
      y -= 2;
    }

    if (section.footer) {
      drawText(section.footer, { size: 8.5, font: regular, color: BODY });
      y -= 2;
    }

    if (section.paragraphs) {
      for (const segs of section.paragraphs) {
        const text = segs.map((s) => s.text).join("");
        drawText(text, { size: 8.5, font: regular, color: BODY });
        y -= 1;
      }
      y -= 2;
    }

    // Section rule
    need(10);
    page.drawLine({ start: { x: MARGIN, y: y }, end: { x: PAGE_W - MARGIN, y: y }, thickness: 0.5, color: LGRAY });
    y -= 10;
  }

  // ── Signature block + closing text ───────────────────────────────
  // Only reserve space for heading + sig box + closing text (~162px).
  // Footer is pinned to the absolute bottom of the last page separately.
  need(162);

  page.drawText("ELECTRONIC SIGNATURE & ACKNOWLEDGMENT", { x: MARGIN, y: y - 6, size: 7, font: bold, color: GRAY });

  const SIG_H = 104;
  const sigTop = y - 18;
  page.drawRectangle({ x: MARGIN, y: sigTop - SIG_H, width: CONTENT_W, height: SIG_H, color: BGRAY, borderColor: LGRAY, borderWidth: 0.75 });
  page.drawText("Digital Signature (Full Legal Name)", { x: MARGIN + 12, y: sigTop - 14, size: 7, font: bold, color: GRAY });
  page.drawText(data.signature, { x: MARGIN + 12, y: sigTop - 32, size: 14, font: boldObl, color: NAVY });
  page.drawText("Date Signed", { x: MARGIN + 12, y: sigTop - 62, size: 7, font: bold, color: GRAY });
  page.drawText(data.date, { x: MARGIN + 12, y: sigTop - 76, size: 9, font: regular, color: BLACK });

  const afterSig = sigTop - SIG_H - 16;
  page.drawText("By submitting this form, the customer has read, understood, and agreed to all terms above.", { x: MARGIN, y: afterSig, size: 7.5, font: regular, color: GRAY });
  page.drawText("This agreement is governed by the laws of the State of Florida.", { x: MARGIN, y: afterSig - 12, size: 7.5, font: regular, color: GRAY });

  // ── Footer: always pinned to the bottom of the last page ─────────
  const lastPage = pdfDoc.getPages().at(-1)!;
  const footerText = `NorthWake Marine  |  Jacksonville, FL  |  northwakemarine.com  |  Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  lastPage.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 38, color: NAVY });
  lastPage.drawText(footerText, { x: MARGIN, y: 14, size: 7, font: regular, color: rgb(0.6, 0.6, 0.75) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
