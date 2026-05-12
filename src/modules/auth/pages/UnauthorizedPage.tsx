import Link from "next/link";

export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
      <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Unauthorized Access</h1>
      <p className="mt-2 text-[var(--text-secondary)]">You do not have permission to access this page.</p>
      <Link
        href="/login"
        className="mt-6 btn-primary"
      >
        Back to Login
      </Link>
    </main>
  );
}
