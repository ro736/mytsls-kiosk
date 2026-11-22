/*
  File Path: src/services/networkPrinter.ts
  File Description: Prints the receipt straight to a network (LAN) thermal printer using ESC/POS over TCP (port 9100).
  Needs react-native-tcp-socket, which works in a development build but NOT in Expo Go.
*/
import { Buffer } from "buffer";

export type ReceiptData = {
  org: string;
  tagline: string;
  number: string;
  reason: string;
  type: string;
  lines: [label: string, value: string][];
  feedbackTitle: string;
  feedbackText: string;
  feedbackUrl: string;
  footer: string;
};

const ESC = 0x1b;
const GS = 0x1d;
const WIDTH = 32; // characters per line; works on 58mm and 80mm paper (text is centred)

const ascii = (s: string) =>
  Array.from(s.normalize("NFD").replace(/[^\x20-\x7e]/g, "")).map((c) => c.charCodeAt(0));

function wrap(s: string, width = WIDTH): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of s.split(" ")) {
    if ((line + " " + word).trim().length > width) {
      if (line) out.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) out.push(line);
  return out;
}

function buildEscPos(d: ReceiptData): Uint8Array {
  const b: number[] = [];
  const raw = (...x: number[]) => b.push(...x);
  const text = (s: string) => raw(...ascii(s));
  const nl = (n = 1) => { for (let i = 0; i < n; i++) raw(0x0a); };
  const center = () => raw(ESC, 0x61, 1);
  const bold = (on: boolean) => raw(ESC, 0x45, on ? 1 : 0);
  const size = (n: number) => raw(GS, 0x21, n); // 0x00 normal, 0x11 double, 0x22 triple
  const sep = () => { text("-".repeat(WIDTH)); nl(); };

  raw(ESC, 0x40); // initialise
  center();

  // ---- Front ----
  bold(true); text(d.org); nl(); bold(false);
  text(d.tagline); nl();
  sep();
  size(0x22); bold(true); text(d.number); nl(); bold(false); size(0x00);
  bold(true); text(d.reason); nl(); bold(false);
  text(d.type); nl();
  sep();
  for (const [k, v] of d.lines) {
    for (const l of wrap(`${k}: ${v}`)) { text(l); nl(); }
  }
  nl(4);
  raw(GS, 0x56, 0x01); // partial cut between front and back

  // ---- Back (feedback) ----
  center();
  bold(true); size(0x11); text(d.feedbackTitle); nl(); size(0x00); bold(false);
  nl();
  // Native QR code
  const data = ascii(d.feedbackUrl);
  const len = data.length + 3;
  raw(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // model 2
  raw(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06);       // module size 6
  raw(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);       // error correction M
  raw(GS, 0x28, 0x6b, len & 0xff, len >> 8, 0x31, 0x50, 0x30, ...data); // store data
  raw(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);       // print
  nl();
  for (const l of wrap(d.feedbackText)) { text(l); nl(); }
  nl();
  text(d.footer); nl();
  nl(4);
  raw(GS, 0x56, 0x42, 0x00); // feed and cut

  return Uint8Array.from(b);
}

function loadTcp(): any {
  try {
    const m = require("react-native-tcp-socket");
    return m.default ?? m;
  } catch {
    return null;
  }
}

export async function printReceiptOverTcp(host: string, port: number, data: ReceiptData): Promise<void> {
  const TcpSocket = loadTcp();
  if (!TcpSocket?.createConnection) {
    throw new Error("Network printing needs a development build (it does not work in Expo Go).");
  }
  const payload = Buffer.from(buildEscPos(data));

  await new Promise<void>((resolve, reject) => {
    let finished = false;
    let client: any;
    const finish = (err?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { client?.destroy(); } catch {}
      err ? reject(err) : resolve();
    };
    const timer = setTimeout(() => finish(new Error("The printer did not respond.")), 8000);
    try {
      client = TcpSocket.createConnection({ host, port }, () => {
        client.write(payload, undefined, (err?: Error) => {
          if (err) finish(err);
          else setTimeout(() => finish(), 400); // let the printer receive everything
        });
      });
      client.on("error", (e: Error) => finish(e));
    } catch (e) {
      finish(e as Error);
    }
  });
}