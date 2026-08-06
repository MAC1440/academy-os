"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@web/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@academyos.dev");
  const [password, setPassword] = useState("Welcome123!");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const data = await login({ email, password });
      localStorage.setItem("accessToken", data.accessToken);
      router.push("/dashboard");
    } catch {
      setError("Unable to sign in. Please verify your credentials.");
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-4 py-16 text-[#470004] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] border border-[#470004]/10 bg-white shadow-[0_25px_80px_rgba(71,0,4,0.12)] lg:flex-row">
        <section className="flex-1 bg-[#470004] px-8 py-10 text-white sm:px-12 lg:px-16 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f3d58b]">AcademyOS</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Secure school operations, built for every campus.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">Monitor attendance, manage staff, and keep every family updated from one elegant control center.</p>
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-[#f3d58b]">Why schools choose us</p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li>• Instant role-based access for admins, teachers, and guardians</li>
              <li>• Protect every request with JWT-backed authentication</li>
              <li>• Keep communications flowing across the school day</li>
            </ul>
          </div>
        </section>

        <section className="flex-1 px-8 py-10 sm:px-12 lg:px-16 lg:py-16">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">Authentication portal</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#470004]">Welcome back</h2>
            <p className="mt-2 text-sm text-[#5b4a4b]">Sign in to manage your school operations.</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#470004]">Email</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none ring-0 focus:border-[#a67c00]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#470004]">Password</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button className="w-full rounded-2xl bg-[#470004] px-4 py-3 font-semibold text-white transition hover:bg-[#6a0006]" type="submit">
                Sign in
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-[#6b5b5d]">
              <Link href="/" className="font-medium text-[#a67c00]">Back home</Link>
              <a href="#" className="font-medium text-[#470004]">Forgot password?</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
