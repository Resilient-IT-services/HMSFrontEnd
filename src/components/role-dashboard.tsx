"use client";

import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "@/lib/auth";
import { formatRole } from "@/lib/formatter";

interface RoleDashboardProps {
  title: string;
}

export function RoleDashboard({ title }: RoleDashboardProps) {
  const router = useRouter();
  const user = getCurrentUser();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-700">
        Welcome, {user?.username ?? user?.email ?? "Unknown user"}
      </p>
      <p className="text-slate-700">Role: {user?.role ? formatRole(user.role) : "Unknown"}</p>
      <button
        onClick={handleLogout}
        className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-black"
      >
        Logout
      </button>
    </main>
  );
}
