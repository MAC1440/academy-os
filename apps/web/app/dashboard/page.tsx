"use client";

import { useAuth } from "@web/features/auth/auth-guard";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors">
  <div className="mx-auto max-w-7xl px-6 py-8">
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-colors">
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-[0.3em]">
          Signed in as
        </p>

        <p className="mt-3 truncate text-lg font-semibold">
          {user.email}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-colors">
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-[0.3em]">
          Focus
        </p>

        <p className="mt-3 text-lg font-semibold">
          Organization module
        </p>

        <Link
          href="/organizations"
          className="mt-4 inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Manage organizations
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-colors">
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-[0.3em]">
          Status
        </p>

        <p className="mt-3 text-lg font-semibold">
          Protected route confirmed
        </p>
      </div>
    </div>
  </div>
</main>
  );
}
