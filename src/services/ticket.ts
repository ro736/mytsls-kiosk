/*
  File Path: src/services/ticket.ts
  File Description: Builds the receipt from the server's ticket and prints it.
  Where it prints is decided by config.printer: server-set network printer, otherwise the printer chosen on this tablet.
*/
import * as Print from "expo-print";
import QRCode from "qrcode";
import { printReceiptOverTcp, ReceiptData } from "./networkPrinter";
import { getPrinter } from "./printer";
import type { KioskConfig, TicketResponse } from "./queueApi";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Fake ticket for the "Test print" button. */
export function sampleTicket(cfg: KioskConfig): TicketResponse {
  const now = new Date();
  return {
    id: 0, number: "T-000", categoryId: 0, category: "Test print",
    branchCode: cfg.branch.code, branchName: cfg.branch.name,
    issuedAt: now.toISOString(),
    issuedDateLocal: now.toLocaleDateString("en-FJ", { day: "2-digit", month: "short", year: "numeric" }),
    issuedTimeLocal: now.toLocaleTimeString("en-FJ", { hour: "2-digit", minute: "2-digit", hour12: true }),
    peopleAhead: 0, estimatedWaitMinutes: 0,
    feedbackUrl: cfg.feedback.enabled ? "https://example.com/feedback" : null,
    visitorName: "Test Customer", visitorContact: "9000000", visitorEmail: null, visitorTin: null,
  };
}

/** Maps the server ticket + config onto the receipt layout. An empty feedbackUrl means no back page. */
export function receiptFromTicket(t: TicketResponse, cfg: KioskConfig): ReceiptData {
  const lines: [string, string][] = [["Name", t.visitorName]];
  if (t.visitorTin) lines.push(["TIN", t.visitorTin]);
  lines.push(["Contact", t.visitorContact]);
  if (t.visitorEmail) lines.push(["Email", t.visitorEmail]);
  lines.push(["Date", t.issuedDateLocal], ["Time", t.issuedTimeLocal]);
  return {
    org: "Tertiary Scholarships & Loans Service",
    tagline: "Empowering Fiji's Future",
    branch: t.branchName,
    number: t.number,
    reason: t.category,
    type: "",
    lines,
    feedbackTitle: cfg.feedback.title,
    feedbackText: cfg.feedback.message,
    feedbackUrl: cfg.feedback.enabled && t.feedbackUrl ? t.feedbackUrl : "",
    footer: `Ticket ${t.number} | Vinaka!`,
  };
}

async function qrSvg(text: string): Promise<string> {
  try {
    const svg = await QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
    return svg.replace("<svg ", '<svg style="width:100%;height:auto;display:block" ');
  } catch {
    return "";
  }
}

/** HTML version for tablets that print through the system / AirPrint. */
async function receiptHtml(d: ReceiptData) {
  const get = (k: string) => d.lines.find((l) => l[0] === k)?.[1];
  const cell = (k: string, v: string, full = false) =>
    `<td ${full ? 'colspan="2"' : ""}><span class="k">${k}</span><span class="v">${esc(v)}</span></td>`;
  const tin = get("TIN"), email = get("Email");
  const rows: string[] = [`<tr>${cell("Name", get("Name") ?? "", true)}</tr>`];
  rows.push(tin ? `<tr>${cell("TIN", tin)}${cell("Contact", get("Contact") ?? "")}</tr>` : `<tr>${cell("Contact", get("Contact") ?? "", true)}</tr>`);
  if (email) rows.push(`<tr>${cell("Email", email, true)}</tr>`);
  rows.push(`<tr>${cell("Date", get("Date") ?? "")}${cell("Time", get("Time") ?? "")}</tr>`);

  const qr = d.feedbackUrl ? await qrSvg(d.feedbackUrl) : "";
  const back = d.feedbackUrl
    ? `<div class="back">
    <p class="fb">${esc(d.feedbackTitle)}</p>
    ${qr ? `<div class="qr">${qr}</div>` : `<p class="note">${esc(d.feedbackUrl)}</p>`}
    <p class="note">${esc(d.feedbackText)}</p>
    <p class="small">${esc(d.footer)}</p>
  </div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  @page { margin: 4mm; }
  body { font-family: Helvetica, Arial, sans-serif; width: 72mm; margin: 0 auto; color: #000; }
  .c { text-align: center; }
  .org { font-size: 12px; font-weight: 700; margin: 0; }
  .tag { font-size: 9px; margin: 0 0 4px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 5px 0; }
  .num { font-size: 38px; font-weight: 800; line-height: 1; margin: 2px 0; letter-spacing: 1px; }
  .reason { font-size: 12px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  td { width: 50%; vertical-align: top; padding: 2px 4px 2px 0; }
  .k { display: block; font-size: 8px; color: #444; }
  .v { display: block; font-size: 11px; font-weight: 600; word-break: break-word; }
  .back { page-break-before: always; text-align: center; padding-top: 6mm; }
  .fb { font-size: 14px; font-weight: 700; margin: 0 0 4px; }
  .qr { width: 42mm; margin: 8px auto; }
  .note { font-size: 11px; margin: 0; }
  .small { font-size: 9px; margin-top: 8px; }
</style></head><body>
  <div class="c">
    <p class="org">${esc(d.org)}</p>
    <p class="tag">${esc(d.tagline)}${d.branch ? ` · ${esc(d.branch)}` : ""}</p>
  </div>
  <hr/>
  <div class="c">
    <div class="num">${esc(d.number)}</div>
    <div class="reason">${esc(d.reason)}</div>
  </div>
  <hr/>
  <table>${rows.join("")}</table>
  ${back}
</body></html>`;
}

/**
 * Prints a ticket the server has issued.
 *  - printer.enabled false        -> nothing is printed (ticket is shown on screen only)
 *  - printer.host set             -> ESC/POS over TCP to host:port
 *  - printer.host null            -> the printer chosen on this tablet (Printer setup); with allowDialog the system print window opens if none is chosen
 * A print failure throws; the ticket already exists on the server, so the caller must not undo it.
 */
export async function printIssuedTicket(t: TicketResponse, cfg: KioskConfig, opts?: { allowDialog?: boolean }) {
  if (!cfg.printer.enabled) return;
  const receipt = receiptFromTicket(t, cfg);

  if (cfg.printer.host) {
    await printReceiptOverTcp(cfg.printer.host, cfg.printer.port ?? 9100, receipt);
    return;
  }

  const saved = await getPrinter();
  if (saved?.type === "network") {
    await printReceiptOverTcp(saved.host, saved.port, receipt);
  } else if (saved?.type === "system") {
    await Print.printAsync({ html: await receiptHtml(receipt), width: 226, printerUrl: saved.url });
  } else if (opts?.allowDialog) {
    await Print.printAsync({ html: await receiptHtml(receipt), width: 226 });
  }
}