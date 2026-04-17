"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100">

        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Hospital Management System 🏥
        </h1>

        <p className="text-gray-600 mb-8">
          Welcome! Please login to continue
        </p>

        <button
            onClick={() => router.push("/Login")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          Go to Login
        </button>

      </div>
  );
}