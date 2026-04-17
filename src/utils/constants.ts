import type { UserRole } from "@/types/auth";

export const AUTH_TOKEN_STORAGE_KEY = "hms_auth_token";
export const AUTH_COOKIE_NAME = "hms_auth_token";

export const ROLE_TO_DASHBOARD: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/dashboard",
  RECEPTION: "/reception/dashboard",
};

export const PROTECTED_ROUTE_PREFIXES: Record<string, UserRole> = {
  "/admin": "ADMIN",
  "/doctor": "DOCTOR",
  "/reception": "RECEPTION",
};
