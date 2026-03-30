import { Alert } from "react-native";
import { api } from "@/lib/api";

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  const n = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  return n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : phone;
}

export type CallRequest = {
  phone: string;
  formatted: string;
  to: string;
};

type CallListener = (req: CallRequest) => void;
const listeners: CallListener[] = [];

export function onCallRequest(fn: CallListener) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function initiateCall(phone: string | null | undefined): void {
  try {
    if (!phone) {
      Alert.alert("No Phone Number", "This contact doesn't have a phone number on file.");
      return;
    }
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 7) {
      Alert.alert("Invalid Number", "This phone number appears to be invalid.");
      return;
    }
    const formatted = formatPhone(phone);
    const to = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
    listeners.forEach((fn) => fn({ phone: cleaned, formatted, to }));
  } catch {
    Alert.alert("Error", "Something went wrong. Try again.");
  }
}

export type CallResult = "success" | "error" | "timeout";

export async function executeCall(to: string): Promise<CallResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    await api.connectCall(to, controller.signal);
    return "success";
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return "timeout";
    }
    return "error";
  } finally {
    clearTimeout(timeoutId);
  }
}

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  return d.length === 11 && d[0] === "1" ? d.slice(1) : d;
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}
