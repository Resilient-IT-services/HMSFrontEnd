import { apiClient } from "@/lib/api-client";
import type { LoginResponse } from "@/types/auth";

export const authService = {
  async loginUser(username: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/api/auth/login", { username, password }, {
      requireAuth: false,
    });
  },
};
