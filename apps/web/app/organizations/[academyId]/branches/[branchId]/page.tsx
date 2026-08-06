"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Branch } from "@academy-os/shared";
import { deleteBranch, getBranch } from "@web/lib/api";

type BranchDetail = Branch & {
  academy?: { id: string; name: string; slug: string };
};

export default function BranchDetailPage() {
  const router = useRouter();
  const params = useParams<{ academyId: string; branchId: string }>();
  const academyId = params.academyId;
  const branchId = params.branchId;

  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBranch(branchId);
      setBranch(data as BranchDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branch");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void loadBranch();
  }, [loadBranch]);

  async function handleDelete() {
    if (!branch) return;
    if (!confirm(`Delete branch "${branch.name}"?`)) return;

    try {
      await deleteBranch(branchId);
      router.push(`/organizations/${academyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete branch");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <div className="mx-auto max-w-4xl text-center text-[#5b4a4b]">
          Loading branch details...
        </div>
      </main>
    );
  }

  if (!branch) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <div className="mx-auto max-w-4xl text-center text-red-600">
          {error ?? "Branch not found"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/organizations/${academyId}`}
          className="text-sm font-medium text-[#a67c00]"
        >
          ← Back to {branch.academy?.name ?? "academy"}
        </Link>

        <div className="mt-6 rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
                  Campus / Branch
                </span>
                <span className="rounded-full bg-[#f3d58b]/40 px-3 py-1 text-xs font-semibold uppercase">
                  {branch.status}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold">{branch.name}</h1>
              <p className="mt-1 text-sm text-[#5b4a4b]">
                Belongs to {branch.academy?.name ?? "Academy"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/organizations/${academyId}/branches/${branchId}/edit`}
                className="rounded-2xl bg-[#470004] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a0006]"
              >
                Edit branch
              </Link>
              <button
                type="button"
                className="rounded-2xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                onClick={() => void handleDelete()}
              >
                Delete branch
              </button>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-2xl bg-[#fffdf8] p-5 border border-[#470004]/5">
              <dt className="text-[#a67c00] font-medium">Address</dt>
              <dd className="mt-1 font-semibold text-base">{branch.address ?? "Not provided"}</dd>
            </div>
            <div className="rounded-2xl bg-[#fffdf8] p-5 border border-[#470004]/5">
              <dt className="text-[#a67c00] font-medium">City & Country</dt>
              <dd className="mt-1 font-semibold text-base">
                {[branch.city, branch.country].filter(Boolean).join(", ") || "Not set"}
              </dd>
            </div>
            <div className="rounded-2xl bg-[#fffdf8] p-5 border border-[#470004]/5">
              <dt className="text-[#a67c00] font-medium">Email</dt>
              <dd className="mt-1 font-semibold text-base">{branch.email ?? "Not provided"}</dd>
            </div>
            <div className="rounded-2xl bg-[#fffdf8] p-5 border border-[#470004]/5">
              <dt className="text-[#a67c00] font-medium">Phone</dt>
              <dd className="mt-1 font-semibold text-base">{branch.phone ?? "Not provided"}</dd>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
