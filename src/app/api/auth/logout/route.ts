import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/utils/constants";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout - unexpected error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
