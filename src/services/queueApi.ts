/*
  File Path: src/services/queueApi.ts
  File Description: myTSLS Queue kiosk API — GET /api/kiosk/config and POST /api/kiosk/tickets,
  plus the saved server address + kiosk key. Every response uses { success, message, data, errors }.
*/
import AsyncStorage from "@react-native-async-storage/async-storage";

const CRED_KEY = "mytsls.kiosk.credentials";
const CONFIG_KEY = "mytsls.kiosk.config";
const TIMEOUT_MS = 10000;

// ---------- Types ----------
export type Credentials = { server: string; key: string };

export type Category = {
  id: number;
  name: string;
  prefix: string;
  icon: string; // Ionicons name
  color: string; // hex
  description: string | null;
  waiting: number;
  estimatedWaitMinutes: number;
};

export type KioskConfig = {
  kioskName: string;
  branch: { id: number; code: string; name: string; [k: string]: unknown };
  categories: Category[];
  feedback: { enabled: boolean; title: string; message: string };
  printer: { enabled: boolean; host: string | null; port: number | null };
  serverTimeUtc: string;
};

export type TicketRequest = {
  categoryId: number;
  name: string;
  contact: string;
  email: string | null;
  tin: string | null;
  isPriority: boolean;
};

export type TicketResponse = {
  id: number;
  number: string;
  categoryId: number;
  category: string;
  branchCode: string;
  branchName: string;
  issuedAt: string;
  issuedDateLocal: string;
  issuedTimeLocal: string;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  feedbackUrl: string | null;
  visitorName: string;
  visitorContact: string;
  visitorEmail: string | null;
  visitorTin: string | null;
};

// ---------- Errors ----------
export class ApiError extends Error {
  status: number; // 0 = no response from the server
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
  /** 401 / 404: key missing, wrong or disabled, or wrong server address */
  get notSetUp() {
    return this.status === 401 || this.status === 404;
  }
}

const NOT_SET_UP = "This kiosk is not set up—please see staff.";

function defaultMessage(status: number) {
  if (status === 401 || status === 404) return NOT_SET_UP;
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 503) return "The queue system is busy. Please try again.";
  if (status >= 500) return "Something went wrong. Please try again.";
  return "We couldn't complete that. Please try again.";
}

// ---------- Saved credentials + cached config ----------
export function normalizeServer(s: string) {
  let v = s.trim();
  // Default to https: the production server answers plain http with an IIS 500 page
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v.endsWith("/") ? v : `${v}/`;
}

export async function getCredentials(): Promise<Credentials | null> {
  try {
    const raw = await AsyncStorage.getItem(CRED_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}
export const saveCredentials = (c: Credentials) => AsyncStorage.setItem(CRED_KEY, JSON.stringify(c));
export const clearCredentials = () => AsyncStorage.removeItem(CRED_KEY);

export async function getCachedConfig(): Promise<KioskConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as KioskConfig) : null;
  } catch {
    return null;
  }
}
export const saveCachedConfig = (c: KioskConfig) => AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(c)).catch(() => {});

/** Reads server + key out of mytslskiosk://setup?server=...&key=... (the set-up QR code). */
export function parseSetupLink(text: string): Credentials | null {
  const s = text.match(/[?&]server=([^&]+)/);
  const k = text.match(/[?&]key=([^&]+)/);
  if (!s || !k) return null;
  try {
    return { server: decodeURIComponent(s[1]), key: decodeURIComponent(k[1]) };
  } catch {
    return null;
  }
}

// ---------- Request helper ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(cred: Credentials, method: "GET" | "POST", path: string, body?: unknown, attempt = 0): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(cred.server + path, {
      method,
      headers: {
        "X-Kiosk-Key": cred.key,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timer);
    // No response. Never auto-retry here: for POST the ticket may already exist.
    throw new ApiError(
      e?.name === "AbortError"
        ? "The queue system is taking too long to answer. Please see the front desk."
        : "Can't reach the queue system—please see the front desk.",
      0,
    );
  }
  clearTimeout(timer);

  let json: any = null;
  try { json = await res.json(); } catch {}

  if (res.ok && json?.success) return json.data as T;

  // The server answered, so retrying once is safe: 429 wait a few seconds, 503 wait 2 seconds
  if ((res.status === 429 || res.status === 503) && attempt === 0) {
    await sleep(res.status === 503 ? 2000 : 3000);
    return request<T>(cred, method, path, body, 1);
  }
  throw new ApiError(json?.message || defaultMessage(res.status), res.status);
}

// ---------- The two calls ----------
/** Called at start-up, every 60 seconds, and when saving the set-up. */
export const getKioskConfig = (cred: Credentials) => request<KioskConfig>(cred, "GET", "api/kiosk/config");

/** Called once, when the customer taps a reason. */
export const issueTicket = (cred: Credentials, data: TicketRequest) =>
  request<TicketResponse>(cred, "POST", "api/kiosk/tickets", data);