"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import api from "@/lib/axios";

type LoginErrorResponse = {
  message?: string;
  error?: string;
};

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setErrorMessage("Username and password are required.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        username: trimmedUsername,
        password: trimmedPassword,
      });

      console.log("Login success:", response.data);
    } catch (error) {
      if (axios.isAxiosError<LoginErrorResponse>(error)) {
        const backendMessage =
          error.response?.data?.message || error.response?.data?.error;
        setErrorMessage(backendMessage || "Invalid username or password");
      } else {
        setErrorMessage("Invalid username or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f7fb]">
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

      <div className="flex w-full items-center justify-center bg-gray-50 lg:w-1/2">
        <div className="w-[400px] rounded-xl bg-white p-8 shadow-md">
          <form onSubmit={handleLogin}>
            <h2 className="mb-2 text-2xl font-semibold text-gray-800">
              Welcome Back
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Please enter your credentials
            </p>

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

            {errorMessage && (
              <p className="mb-3 text-sm text-red-500">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-700 py-3 text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login ->"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
