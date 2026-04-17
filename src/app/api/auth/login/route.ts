import { NextResponse } from "next/server";
import type { LoginRequest } from "@/types/auth";
import { AUTH_COOKIE_NAME } from "@/utils/constants";

interface BackendErrorResponse {
  message?: string;
}

interface BackendLoginSuccessResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
}

function getBackendLoginUrl(): string {
  if (process.env.BACKEND_LOGIN_URL) {
    return process.env.BACKEND_LOGIN_URL;
  }

  const baseUrl = process.env.BACKEND_BASE_URL ?? "http://localhost:8081";
  const path = process.env.BACKEND_LOGIN_PATH ?? "/api/auth/login";
  return new URL(path, baseUrl).toString();
}

function getTokenFromResponse(data: BackendLoginSuccessResponse): string | null {
  if (typeof data.token === "string" && data.token.trim()) return data.token;
  if (typeof data.accessToken === "string" && data.accessToken.trim()) return data.accessToken;
  if (typeof data.jwt === "string" && data.jwt.trim()) return data.jwt;
  return null;
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
    const usernameInput = typeof body.username === "string" ? body.username : "";
    const passwordInput = typeof body.password === "string" ? body.password : "";
    const username = usernameInput.trim();
    const password = passwordInput;

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    const backendUrl = getBackendLoginUrl();
    let backendResponse: Response;

    try {
      backendResponse = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ username, password }),
      });
    } catch (error) {
      console.error("POST /api/auth/login - backend unreachable", error);
      return NextResponse.json({ message: "Backend service is unreachable" }, { status: 502 });
    }

    let backendPayload: unknown;
    const contentType = backendResponse.headers.get("content-type") ?? "";

    try {
      backendPayload = contentType.includes("application/json")
        ? await backendResponse.json()
        : { message: await backendResponse.text() };
    } catch {
      backendPayload = { message: "Invalid backend response" };
    }

    if (!backendResponse.ok) {
      const message =
        typeof backendPayload === "object" &&
        backendPayload !== null &&
        "message" in backendPayload &&
        typeof (backendPayload as BackendErrorResponse).message === "string"
          ? (backendPayload as BackendErrorResponse).message
          : "Login failed";

      return NextResponse.json({ message }, { status: backendResponse.status });
    }

    const token =
      typeof backendPayload === "object" && backendPayload !== null
        ? getTokenFromResponse(backendPayload as BackendLoginSuccessResponse)
        : null;

    if (!token) {
      return NextResponse.json({ message: "Backend login response missing token" }, { status: 502 });
    }

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
