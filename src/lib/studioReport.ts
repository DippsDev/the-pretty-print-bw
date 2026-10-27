import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Service, ServiceGroup } from "@/lib/servicesData";
import type { StudioBooking } from "@/lib/studioTypes";
import { formatPula, outstandingAmount, paidAmount, paymentLabel, refundedAmount } from "@/lib/studioMoney";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const INK = rgb(38 / 255, 38 / 255, 38 / 255);
const MUTED = rgb(98 / 255, 93 / 255, 85 / 255);
const LINE = rgb(196 / 255, 191 / 255, 184 / 255);
const PAPER = rgb(238 / 255, 238 / 255, 236 / 255);

function clean(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00b7/g, "|")
    .replace(/\u2022/g, "|")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function priceText(price: Service["price"]) {
  if (typeof price === "string") return price;
  if (Array.isArray(price)) return price.map((option) => `${option.label} ${option.value}`).join(", ");
  if (price && typeof price === "object") {
    return Object.entries(price)
      .map(([label, value]) => `${label} ${value ?? ""}`.trim())
      .join(", ");
  }
  return "";
}

function minutesFromTime(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function dayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unscheduled";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayTitle(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = clean(text).split(" ").filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildStudioReport(bookings: StudioBooking[], groups: ServiceGroup[]) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("thePRETTYPRINT studio book");
  pdf.setAuthor("thePRETTYPRINT");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const paintPaper = (target: PDFPage) => {
    target.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
  };
  paintPaper(page);

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const bottom = 48;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    paintPaper(page);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensure = (height: number) => {
    if (y - height < bottom) newPage();
  };

  const text = (value: string, x: number, size: number, font: PDFFont, color = INK) => {
    page.drawText(clean(value), { x, y, size, font, color });
  };

  const rule = () => {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.6,
      color: LINE,
    });
  };

  const paid = bookings.reduce((sum, booking) => sum + paidAmount(booking), 0);
  const refunded = bookings.reduce((sum, booking) => sum + refundedAmount(booking), 0);
  const outstanding = bookings.reduce((sum, booking) => sum + outstandingAmount(booking), 0);
  const exported = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  text("thePRETTYPRINT", MARGIN, 18, bold);
  const kicker = "STUDIO BOOK";
  text(kicker, PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(kicker, 9), 9, bold, MUTED);
  y -= 16;
  text("Hair studio  |  Gaborone", MARGIN, 9, regular, MUTED);
  y -= 14;
  text(`Exported ${exported}`, MARGIN, 9, regular, MUTED);
  y -= 16;
  rule();
  y -= 28;

  text("SUMMARY", MARGIN, 9, bold, MUTED);
  y -= 22;
  const figures = [
    ["Bookings", String(bookings.length)],
    ["Paid", formatPula(paid)],
    ["Refunded", formatPula(refunded)],
    ["Outstanding", formatPula(outstanding)],
  ];
  const column = contentWidth / figures.length;
  figures.forEach(([label, value], index) => {
    const x = MARGIN + column * index;
    page.drawText(label.toUpperCase(), { x, y, size: 8, font: bold, color: MUTED });
    page.drawText(value, { x, y: y - 18, size: 16, font: bold, color: INK });
  });
  y -= 36;
  rule();
  y -= 28;

  text("BOOKINGS", MARGIN, 9, bold, MUTED);
  y -= 18;

  const ordered = [...bookings].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();
    const leftOk = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime;
    const rightOk = Number.isNaN(rightTime) ? Number.MAX_SAFE_INTEGER : rightTime;
    if (leftOk !== rightOk) return leftOk - rightOk;
    return minutesFromTime(left.time) - minutesFromTime(right.time);
  });

  if (ordered.length === 0) {
    text("No bookings yet.", MARGIN, 11, regular, MUTED);
    y -= 24;
  }

  let previousDay = "";
  for (const booking of ordered) {
    const services = booking.services.map((service) =>
      [service.name, service.price, service.stylist].filter(Boolean).join("  |  "),
    );
    const contact = [booking.clientEmail, booking.clientPhone].filter(Boolean).join("  |  ");
    const extras = [
      contact,
      ...services,
      booking.notes ? `Note: ${booking.notes}` : "",
      booking.payment === "refunded"
        ? `Refund ${formatPula(refundedAmount(booking))}${booking.refundNote ? `  |  ${booking.refundNote}` : ""}`
        : "",
    ].filter(Boolean);
    const detailLines = extras.flatMap((line) => wrap(line, regular, 9, contentWidth));
    const key = dayKey(booking.date);
    const startsDay = key !== previousDay;
    ensure((startsDay ? 38 : 0) + 34 + detailLines.length * 12);

    if (startsDay) {
      previousDay = key;
      y -= 8;
      text(dayTitle(booking.date).toUpperCase(), MARGIN, 9, bold, MUTED);
      y -= 14;
      rule();
      y -= 16;
    }

    const when = clean(booking.time) || "Time not set";
    const amount = formatPula(booking.total);
    const status = `${booking.status === "cancelled" ? "Cancelled  |  " : ""}${paymentLabel(booking)}`;
    text(when, MARGIN, 11, bold);
    const amountWidth = bold.widthOfTextAtSize(amount, 11);
    const statusWidth = regular.widthOfTextAtSize(status, 9);
    const statusX = PAGE_WIDTH - MARGIN - amountWidth - 16 - statusWidth;
    if (statusX > MARGIN + bold.widthOfTextAtSize(when, 11) + 12) {
      page.drawText(status, { x: statusX, y: y + 1, size: 9, font: regular, color: MUTED });
      page.drawText(amount, { x: PAGE_WIDTH - MARGIN - amountWidth, y, size: 11, font: bold, color: INK });
      y -= 14;
    } else {
      page.drawText(amount, { x: PAGE_WIDTH - MARGIN - amountWidth, y, size: 11, font: bold, color: INK });
      y -= 14;
      page.drawText(status, {
        x: PAGE_WIDTH - MARGIN - statusWidth,
        y,
        size: 9,
        font: regular,
        color: MUTED,
      });
      y -= 12;
    }
    text(booking.clientName || "Client", MARGIN, 11, regular);
    y -= 13;
    for (const line of detailLines) {
      text(line, MARGIN, 9, regular, MUTED);
      y -= 12;
    }
    y -= 6;
    rule();
    y -= 14;
  }

  ensure(40);
  y -= 8;
  text("SERVICES", MARGIN, 9, bold, MUTED);
  y -= 16;
  text("Current menu. Amounts are in Botswana pula.", MARGIN, 9, regular, MUTED);
  y -= 16;

  for (const group of groups) {
    ensure(36);
    text(group.label.toUpperCase(), MARGIN, 9, bold);
    y -= 12;
    if (group.blurb) {
      for (const line of wrap(group.blurb, regular, 9, contentWidth)) {
        text(line, MARGIN, 9, regular, MUTED);
        y -= 12;
      }
    }
    y -= 4;
    for (const service of group.services) {
      const minutes = service.durationMinutes ? `${service.durationMinutes} min` : "";
      const price = priceText(service.price) || "-";
      const nameLines = wrap(service.name, regular, 10, contentWidth - 130);
      ensure(nameLines.length * 13 + 8);
      nameLines.forEach((line, index) => {
        text(line, MARGIN, 10, regular);
        if (index === 0) {
          const priceWidth = regular.widthOfTextAtSize(price, 10);
          page.drawText(price, {
            x: PAGE_WIDTH - MARGIN - priceWidth,
            y,
            size: 10,
            font: regular,
            color: INK,
          });
          if (minutes) {
            const minutesWidth = regular.widthOfTextAtSize(minutes, 10);
            page.drawText(minutes, {
              x: PAGE_WIDTH - MARGIN - 64 - minutesWidth,
              y,
              size: 10,
              font: regular,
              color: MUTED,
            });
          }
        }
        y -= 13;
      });
    }
    y -= 10;
  }

  const pages = pdf.getPages();
  pages.forEach((target, index) => {
    const label = `${index + 1}  /  ${pages.length}`;
    target.drawText(label, {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(label, 8),
      y: 24,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  return pdf.save();
}
