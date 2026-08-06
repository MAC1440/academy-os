"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch("http://localhost:3000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();
        setUser(data.user);
      })
      .catch(() => router.replace("/login"));
  }, []);

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">Protected dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold">Welcome to AcademyOS</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#5b4a4b]">Your authentication flow is active and protected routes are now reachable after sign in.</p>
          </div>
          <button className="rounded-2xl bg-[#470004] px-4 py-3 font-semibold text-white" onClick={logout}>Sign out</button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[#470004]/10 bg-[#fffdf8] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">Signed in as</p>
            <p className="mt-3 text-lg font-semibold text-[#470004]">{user?.email ?? "Secure user"}</p>
          </div>
          <div className="rounded-3xl border border-[#470004]/10 bg-[#fffdf8] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">Focus</p>
            <p className="mt-3 text-lg font-semibold text-[#470004]">Attendance, fees, and communication</p>
          </div>
          <div className="rounded-3xl border border-[#470004]/10 bg-[#fffdf8] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">Status</p>
            <p className="mt-3 text-lg font-semibold text-[#470004]">Protected route confirmed</p>
          </div>
        </div>
      </div>
    </main>
  );
}
