import { NextResponse } from "next/server";

const BACKEND_LOGIN_URL = "http://localhost:8081/api/auth/login";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(BACKEND_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await backendResponse.text();
    const contentType =
      backendResponse.headers.get("content-type") ?? "application/json";

    const response = new NextResponse(responseText, {
      status: backendResponse.status,
      headers: {
        "Content-Type": contentType,
      },
    });

    const setCookie = backendResponse.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Backend login service is unavailable" },
      { status: 502 },
    );
  }
}
