export type UserRole = "ADMIN" | "DOCTOR" | "RECEPTION";

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
}
