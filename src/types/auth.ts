export type UserRole = "ADMIN" | "DOCTOR" | "RECEPTIONIST";

export interface JwtPayload {
  id: number;
  email?: string;
  username?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
}
