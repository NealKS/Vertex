import { PDFDocument, StandardFonts, rgb, PDFString } from "pdf-lib";
import { HACKATHON_EMAIL as c } from "./hackathonEmail";

/** Generates all bytes in memory; no filesystem or network access on Vercel. */
export async function generateFinaleGuide(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Build With Sarvam - Finale Guide");
  pdf.setAuthor("Team Vertex, REVA University");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.16, 0.12),
    green = rgb(0.19, 0.36, 0.23),
    muted = rgb(0.34, 0.39, 0.35);
  const width = 595.28,
    height = 841.89,
    margin = 48;
  const clean = (value: string) =>
    value
      .replace(/₹/g, "INR ")
      .replace(/[–—]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/•/g, "-");
  let page = pdf.addPage([width, height]),
    y = height - 145;
  const decorate = (title: string) => {
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.985, 0.978, 0.954) });
    page.drawRectangle({ x: 0, y: height - 112, width, height: 112, color: ink });
    page.drawText("VERTEX x SARVAM AI", {
      x: margin,
      y: height - 35,
      size: 10,
      font: bold,
      color: rgb(0.73, 0.85, 0.67),
    });
    page.drawText(title, {
      x: margin,
      y: height - 76,
      size: 26,
      font: bold,
      color: rgb(1, 1, 0.97),
    });
    y = height - 145;
  };
  decorate("Finale guide");
  const next = (title: string) => {
    page = pdf.addPage([width, height]);
    decorate(title);
  };
  const text = (
    value: string,
    options: { size?: number; strong?: boolean; href?: string } = {},
  ) => {
    const size = options.size ?? 11,
      font = options.strong ? bold : regular,
      lineHeight = size * 1.5;
    const words = clean(value).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (let word of words) {
      // Wrap long URLs too, without clipping the page edge.
      while (font.widthOfTextAtSize(word, size) > width - margin * 2) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let cut = word.length - 1;
        while (font.widthOfTextAtSize(word.slice(0, cut), size) > width - margin * 2) cut--;
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width - margin * 2) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    for (const l of lines) {
      if (y < 65) next("Finale guide - continued");
      page.drawText(l, { x: margin, y, size, font, color: options.href ? green : ink });
      if (options.href) {
        const annotation = pdf.context.register(
          pdf.context.obj({
            Type: "Annot",
            Subtype: "Link",
            Rect: [margin, y - 3, margin + font.widthOfTextAtSize(l, size), y + size],
            Border: [0, 0, 0],
            A: { Type: "Action", S: "URI", URI: PDFString.of(options.href) },
          }),
        );
        page.node.addAnnot(annotation);
      }
      y -= lineHeight;
    }
    y -= 7;
  };
  const heading = (value: string) => {
    y -= 8;
    text(value, { size: 15, strong: true });
  };
  const schedule = (day: string) => {
    for (const entry of c.SCHEDULE.filter((entry) => entry.day.startsWith(day))) {
      text(`${entry.time}  |  ${entry.activity}`, { size: 11 });
    }
  };
  heading("1. Event details");
  text(`${c.eventName} | ${c.finale} | ${c.mode}`, { strong: true });
  text(c.venue);
  text(`${c.teamSize} Team members cannot be added or replaced without organizer approval.`);
  heading("2. Day 1 - 13 November 2026 (IST)");
  schedule("Day 1");
  next("Day 2 & prizes");
  heading("3. Day 2 - 14 November 2026 (IST)");
  schedule("Day 2");
  heading("4. Prizes - Sarvam API credits");
  for (const prize of c.PRIZES) text(prize, { strong: prize.startsWith("Total") });
  next("Rules & resources");
  heading("5. Important rules");
  c.RULES.forEach((rule, i) => text(`${i + 1}. ${rule}`, { size: 10 }));
  heading("6. Food and accommodation");
  text(c.guideFood, { size: 10 });
  heading("7. Sarvam resources");
  for (const link of [
    { label: c.indusButton, url: c.INDUS_LINK },
    ...c.SARVAM_LINKS,
    { label: c.whatsappButton, url: c.WHATSAPP_GROUP_LINK },
  ]) {
    text(link.label, { size: 10, strong: true, href: link.url });
    text(link.url, { size: 8, href: link.url });
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: margin, y: 43 },
      end: { x: width - margin, y: 43 },
      color: rgb(0.77, 0.8, 0.75),
      thickness: 0.5,
    });
    p.drawText(`Team Vertex | REVA University | ${i + 1} / ${pages.length}`, {
      x: margin,
      y: 27,
      size: 9,
      font: regular,
      color: muted,
    });
  });
  // PDF dates are fixed to the event document edition for stable payloads.
  pdf.setCreationDate(new Date("2026-11-10T00:00:00Z"));
  pdf.setModificationDate(new Date("2026-11-10T00:00:00Z"));
  return pdf.save();
}
