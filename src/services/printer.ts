/*
  File Path: src/services/printer.ts
  File Description: Remembers the printer chosen for testing.
  - iOS: pick from the native printer list ("system" printer)
  - Android / other: save a network printer (IP address + port) once, so nobody has to choose again
*/
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { Platform } from "react-native";

const KEY = "mytsls.printer";

export type SavedPrinter =
  | { type: "system"; name: string; url: string }
  | { type: "network"; name: string; host: string; port: number };

export const canPickPrinter = Platform.OS === "ios";

export async function getPrinter(): Promise<SavedPrinter | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p.type) return p as SavedPrinter;
    return p.url ? { type: "system", name: p.name, url: p.url } : null; // older saved format
  } catch {
    return null;
  }
}

export async function clearPrinter() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}

async function save(p: SavedPrinter) {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

/** iOS only: opens the native printer picker and remembers the choice. */
export async function pickPrinter(): Promise<SavedPrinter | null> {
  if (!canPickPrinter) return null;
  const p = await Print.selectPrinterAsync();
  if (!p?.url) return null;
  return save({ type: "system", name: p.name, url: p.url });
}

/** Saves a LAN thermal printer (usually port 9100). */
export async function saveNetworkPrinter(host: string, port: number): Promise<SavedPrinter> {
  return save({ type: "network", name: `Network printer ${host}:${port}`, host: host.trim(), port });
}