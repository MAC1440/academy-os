"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Fraunces } from "next/font/google";
import { login } from "@web/lib/api";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { Card, CardContent } from "@web/components/ui/card";
import { Alert, AlertDescription } from "@web/components/ui/alert";

// Serif display face, used only for the headline — everything else stays
// on the system sans so the page doesn't pick up a second workhorse font.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@academyos.dev");
  const [password, setPassword] = useState("Welcome123!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // login() persists both accessToken and refreshToken internally.
      await login({ email, password });
      router.push("/dashboard");
    } catch {
      setError("Unable to sign in. Please verify your credentials.");
      setSubmitting(false);
    }
  }

  return (
    <main className={`${fraunces.variable} min-h-screen bg-[#fffdf8] px-4 py-10 text-[#470004] sm:px-6 lg:px-8 lg:py-16`}>
      <div className="mx-auto flex min-h-[640px] max-w-6xl flex-col overflow-hidden rounded-[32px] border border-[#470004]/10 bg-white shadow-[0_25px_80px_rgba(71,0,4,0.12)] lg:flex-row">
        {/* Brand panel */}
        <section className="relative flex-1 overflow-hidden bg-[#470004] px-8 py-10 text-white sm:px-12 lg:px-16 lg:py-16">
          {/* Ambient seal pattern — quiet, not decorative for its own sake:
              echoes the "campus crest" idea the seal mark up top states directly. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-[#f3d58b]/[0.08]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-[340px] w-[340px] rounded-full border border-[#f3d58b]/[0.1]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-[260px] w-[260px] rounded-full border border-[#f3d58b]/[0.12]"
          />

          <div className="relative flex h-full flex-col">
            {/* Seal / monogram mark */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3d58b]/40 text-sm font-semibold tracking-[0.15em] text-[#f3d58b]">
              AOS
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-[#f3d58b]">
              AcademyOS
            </p>
            <h1
              style={{ fontFamily: "var(--font-display)" }}
              className="mt-5 text-4xl font-medium italic leading-[1.15] text-[#fffdf8] sm:text-5xl"
            >
              Secure school operations,
              <br />
              built for every campus.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Monitor attendance, manage staff, and keep every family updated
              from one elegant control center.
            </p>

            <div className="mt-auto pt-10">
              <div className="h-px w-full bg-[#f3d58b]/15" />
              <ul className="mt-6 space-y-4 text-sm text-white/80">
                <li className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3d58b]" />
                  Instant role-based access for admins, teachers, and guardians
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3d58b]" />
                  Every request protected by JWT-backed authentication
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f3d58b]" />
                  Communication that keeps pace with the school day
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Form panel */}
        <section className="flex flex-1 items-center px-8 py-10 sm:px-12 lg:px-16 lg:py-16">
          <Card className="w-full max-w-md border-none bg-transparent p-0 shadow-none">
            <CardContent className="p-0">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
                Authentication portal
              </p>
              <h2
                style={{ fontFamily: "var(--font-display)" }}
                className="mt-3 text-3xl font-medium text-[#470004]"
              >
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[#5b4a4b]">
                Sign in to manage your school operations.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#470004]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl border-[#470004]/15 bg-[#fffdf8] px-4 text-[#470004] focus-visible:border-[#a67c00] focus-visible:ring-[#a67c00]/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#470004]">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border-[#470004]/15 bg-[#fffdf8] px-4 text-[#470004] focus-visible:border-[#a67c00] focus-visible:ring-[#a67c00]/30"
                  />
                </div>

                {error ? (
                  <Alert
                    variant="destructive"
                    className="rounded-2xl border-red-200 bg-red-50 py-3 text-red-700"
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-2xl bg-[#470004] text-base font-semibold text-white hover:bg-[#6a0006] disabled:opacity-70"
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm text-[#6b5b5d]">
                <Link href="/" className="font-medium text-[#a67c00] hover:text-[#8a6600]">
                  Back home
                </Link>
                <a href="#" className="font-medium text-[#470004] hover:text-[#6a0006]">
                  Forgot password?
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
