import type { JwtPayload } from "@/types/auth";

function normalizeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return padded;
}

function binaryToUtf8(input: string): string {
  const bytes = Uint8Array.from(input, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payloadBase64Url = parts[1];
    const payloadJson = binaryToUtf8(atob(normalizeBase64Url(payloadBase64Url)));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    const hasIdentity = Boolean(payload?.email || payload?.username);
    if (!payload?.role || !hasIdentity || typeof payload?.id !== "number") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
