import { getToken } from "@/lib/auth";
import type { ApiErrorResponse } from "@/types/auth";

interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: HeadersInit;
  requireAuth?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, requireAuth = true, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  requestHeaders.set("Accept", "application/json");

  if (requireAuth) {
    const token = getToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorData = await parseResponse<ApiErrorResponse>(response);
      if (
        errorData &&
        typeof errorData === "object" &&
        "message" in errorData &&
        typeof errorData.message === "string"
      ) {
        message = errorData.message;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  return parseResponse<T>(response);
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "POST", body }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PUT", body }),

  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PATCH", body }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "DELETE" }),
};
