import type { UserRole } from "@/types/auth";
import { PROTECTED_ROUTE_PREFIXES } from "@/utils/constants";

export function getRequiredRoleForPath(pathname: string): UserRole | null {
  const entry = Object.entries(PROTECTED_ROUTE_PREFIXES).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return entry ? entry[1] : null;
}
