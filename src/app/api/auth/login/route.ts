import { NextResponse } from "next/server";
import type { JwtPayload, LoginRequest, UserRole } from "@/types/auth";
import { AUTH_COOKIE_NAME } from "@/utils/constants";

interface MockUser {
  id: number;
  email: string;
  password: string;
  role: UserRole;
}

const MOCK_USERS: MockUser[] = [
  { id: 1, email: "admin@hms.com", password: "admin123", role: "ADMIN" },
  { id: 2, email: "doctor@hms.com", password: "doctor123", role: "DOCTOR" },
  { id: 3, email: "reception@hms.com", password: "reception123", role: "RECEPTION" },
];

function encodeBase64Url(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createMockJwt(payload: JwtPayload): string {
  const header = { alg: "none", typ: "JWT" };
  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(
    JSON.stringify(payload),
  )}.`;
}

export async function POST(request: Request) {
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch (error) {
    console.error("POST /api/auth/login - invalid JSON payload", error);
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  try {
    const emailInput = typeof body.email === "string" ? body.email : "";
    const passwordInput = typeof body.password === "string" ? body.password : "";
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const matchedUser = MOCK_USERS.find(
      (user) => user.email === email && user.password === password,
    );

    if (!matchedUser) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      id: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      iat: now,
      exp: now + 60 * 60,
    };

    const token = createMockJwt(payload);

    const response = NextResponse.json({ token }, { status: 200 });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login - unexpected error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
