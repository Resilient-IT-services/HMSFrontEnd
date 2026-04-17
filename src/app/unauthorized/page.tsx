import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Unauthorized</h1>
      <p className="mt-2 text-slate-600">You do not have permission to access this page.</p>
      <Link
        href="/login"
        className="mt-6 rounded-md bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
      >
        Back to Login
      </Link>
    </main>
  );
}
