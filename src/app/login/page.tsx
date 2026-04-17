"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { decodeToken, saveToken } from "@/lib/auth";
import { ROLE_TO_DASHBOARD } from "@/utils/constants";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      const { token } = await authService.loginUser(
          username.trim(),
          password
      );

      saveToken(token);

      const payload = decodeToken(token);
      if (!payload) {
        throw new Error("Invalid authentication token");
      }

      router.replace(ROLE_TO_DASHBOARD[payload.role]);
      router.refresh();
    } catch (err) {
      const message =
          err instanceof Error
              ? err.message
              : "Unable to login. Please try again.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex h-screen bg-[#f5f7fb]">
        {/* LEFT SIDE */}
        <div className="relative hidden w-1/2 lg:flex">
          <img
              src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
              className="absolute h-full w-full object-cover"
              alt="Healthcare"
          />

          <div className="absolute inset-0 bg-blue-900/90" />

          <div className="relative z-10 flex flex-col justify-between p-16 text-white">
            <div className="text-lg font-semibold">Clinical Sanctuary</div>

            <div>
              <h1 className="mb-4 text-4xl font-bold">
                The Clinical Sanctuary for Modern Healthcare.
              </h1>

              <p className="text-sm opacity-80">
                Experience a focused journey into medical management.
              </p>
            </div>

            <p className="text-xs opacity-60">Clinical Sanctuary</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex w-full items-center justify-center bg-gray-50 lg:w-1/2">
          <div className="w-[400px] rounded-xl bg-white p-8 shadow-md">
            <form onSubmit={handleLogin}>
              <h2 className="mb-2 text-2xl font-semibold text-gray-800">
                Welcome Back
              </h2>

              <p className="mb-6 text-sm text-gray-500">
                Please enter your credentials
              </p>

              {/* USERNAME */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700">
                  USERNAME
                </label>

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter username"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* PASSWORD */}
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700">
                  PASSWORD
                </label>

                <div className="relative">
                  <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="********"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <span
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-4 cursor-pointer text-gray-500"
                  >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
                </div>
              </div>

              {/* ERROR */}
              {errorMessage && (
                  <p className="mb-3 text-sm text-red-500">
                    {errorMessage}
                  </p>
              )}

              {/* BUTTON */}
              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-700 py-3 text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

          </div>
        </div>
      </div>
  );
}