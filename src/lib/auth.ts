import { decodeToken } from "@/lib/jwt";
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

export function getCurrentUser(): JwtPayload | null {
  const token = getToken();
  if (!token) {
    return null;
  }

  return decodeToken(token);
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

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

export { decodeToken };
