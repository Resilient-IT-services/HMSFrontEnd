import type { UserRole } from "@/types/auth";

export function formatRole(role: UserRole): string {
  const mapping: Record<UserRole, string> = {
    ADMIN: "Admin",
    DOCTOR: "Doctor",
    RECEPTIONIST: "Receptionist",
  };

  return mapping[role];
}
