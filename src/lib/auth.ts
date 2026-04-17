import type { JwtPayload } from "@/types/auth";
import { AUTH_COOKIE_NAME, AUTH_TOKEN_STORAGE_KEY } from "@/utils/constants";

export function saveToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function removeToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function normalizeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
}

function binaryToUtf8(input: string): string {
  const bytes = Uint8Array.from(input, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function normalizeRole(role: unknown): JwtPayload["role"] | null {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role.trim().toUpperCase();

  if (normalizedRole === "ADMIN" || normalizedRole === "DOCTOR") {
    return normalizedRole;
  }

  if (normalizedRole === "RECEPTION" || normalizedRole === "RECEPTIONIST") {
    return "RECEPTIONIST";
  }

  return null;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payloadBase64Url = parts[1];
    const payloadJson = binaryToUtf8(atob(normalizeBase64Url(payloadBase64Url)));
    const payload = JSON.parse(payloadJson) as Partial<JwtPayload> & { role?: unknown };
    const role = normalizeRole(payload.role);
    const hasIdentity = Boolean(payload.email || payload.username);

    if (!role || !hasIdentity || typeof payload.id !== "number") {
      return null;
    }

    return {
      ...payload,
      role,
    } as JwtPayload;
  } catch {
    return null;
  }
}

export function getCurrentUser(): JwtPayload | null {
  const token = getToken();
  if (!token) {
    return null;
  }

  return decodeToken(token);
}

export async function logout(): Promise<void> {
  removeToken();

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    if (typeof document !== "undefined") {
      document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/;`;
    }
  }
}
