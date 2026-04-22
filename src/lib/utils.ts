import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function trimToString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function toAbsolutePublicUrl(value: string | null | undefined, base?: string): string | null {
  const url = trimToString(value);
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url)) return url;

  const fallbackBase =
    base ??
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!fallbackBase) return null;

  try {
    return new URL(url, fallbackBase).toString();
  } catch {
    return null;
  }
}

export function isSecureHttpUrl(value: unknown): value is string {
  const trimmed = trimToString(value);
  if (!trimmed) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  return trimmed.startsWith("https://") || trimmed.startsWith("http://");
}
