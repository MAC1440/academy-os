"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Academy, Branch } from "@academy-os/shared";
import { deleteBranch, getAcademy } from "@web/lib/api";

type AcademyDetail = Academy & {
  branches: Branch[];
  _count?: { branches: number };
};

export default function AcademyDetailPage() {
  const params = useParams<{ academyId: string }>();
  const academyId = params.academyId;

  const [academy, setAcademy] = useState<AcademyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAcademy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAcademy(academyId);
      setAcademy(data as AcademyDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load academy");
    } finally {
      setLoading(false);
    }
  }, [academyId]);

  useEffect(() => {
    void loadAcademy();
  }, [loadAcademy]);

  async function handleDeleteBranch(branchId: string, name: string) {
    if (!confirm(`Delete branch "${name}"?`)) return;

    try {
      await deleteBranch(branchId);
      await loadAcademy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <p className="text-center text-[#5b4a4b]">Loading academy...</p>
      </main>
    );
  }

  if (!academy) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <p className="text-center text-red-600">{error ?? "Academy not found"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-6xl">
        <Link href="/organizations" className="text-sm font-medium text-[#a67c00]">
          ← Back to academies
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                {academy.logo ? (
                  <img
                    src={academy.logo}
                    alt={`${academy.name} logo`}
                    className="h-16 w-16 rounded-2xl border border-[#470004]/10 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3d58b]/40 text-xl font-semibold">
                    {academy.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
                    Academy
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold">{academy.name}</h1>
                  <p className="mt-1 text-sm text-[#5b4a4b]">{academy.slug}</p>
                </div>
              </div>
              <Link
                href={`/organizations/${academy.id}/edit`}
                className="inline-flex rounded-2xl border border-[#470004]/15 px-4 py-2 text-xs font-semibold hover:border-[#a67c00]"
              >
                Edit Academy
              </Link>
            </div>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-2xl bg-[#fffdf8] p-4">
                <dt className="text-[#a67c00]">Email</dt>
                <dd className="mt-1 font-medium">{academy.email ?? "—"}</dd>
              </div>
              <div className="rounded-2xl bg-[#fffdf8] p-4">
                <dt className="text-[#a67c00]">Phone</dt>
                <dd className="mt-1 font-medium">{academy.phone ?? "—"}</dd>
              </div>
              <div className="rounded-2xl bg-[#fffdf8] p-4">
                <dt className="text-[#a67c00]">Timezone</dt>
                <dd className="mt-1 font-medium">{academy.timezone}</dd>
              </div>
              <div className="rounded-2xl bg-[#fffdf8] p-4">
                <dt className="text-[#a67c00]">Currency</dt>
                <dd className="mt-1 font-medium">{academy.currency}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[32px] border border-[#470004]/10 bg-[#470004] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f3d58b]">
              Architecture rule
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Branch-first design</h2>
            <p className="mt-4 text-sm text-white/80">
              Every future module belongs to a branch — never directly to the academy. Create at least
              one branch before adding students, teachers, or classes.
            </p>
            <Link
              href={`/organizations/${academy.id}/branches/new`}
              className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#470004]"
            >
              Add branch
            </Link>
          </section>
        </div>

        <section className="mt-6 rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Branches</h2>
              <p className="mt-1 text-sm text-[#5b4a4b]">
                {academy.branches.length} branch{academy.branches.length === 1 ? "" : "es"} configured
              </p>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 space-y-3">
            {academy.branches.length === 0 ? (
              <p className="rounded-2xl bg-[#fffdf8] p-6 text-sm text-[#5b4a4b]">
                No branches yet. Add your first campus to start operating.
              </p>
            ) : (
              academy.branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[#470004]/10 bg-[#fffdf8] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{branch.name}</p>
                    <p className="mt-1 text-sm text-[#5b4a4b]">
                      {[branch.city, branch.country].filter(Boolean).join(", ") || "Location not set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#f3d58b]/40 px-3 py-1 text-xs font-semibold uppercase">
                      {branch.status}
                    </span>
                    <Link
                      href={`/organizations/${academy.id}/branches/${branch.id}`}
                      className="rounded-xl border border-[#470004]/15 px-3 py-1.5 text-xs font-semibold hover:border-[#a67c00]"
                    >
                      View
                    </Link>
                    <Link
                      href={`/organizations/${academy.id}/branches/${branch.id}/edit`}
                      className="rounded-xl border border-[#470004]/15 px-3 py-1.5 text-xs font-semibold hover:border-[#a67c00]"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      onClick={() => void handleDeleteBranch(branch.id, branch.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
