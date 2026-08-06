"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Academy } from "@academy-os/shared";
import { deleteAcademy, listAcademies } from "@web/lib/api";

type AcademyRow = Academy & { _count?: { branches: number } };

export default function OrganizationsPage() {
  const [academies, setAcademies] = useState<AcademyRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAcademies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAcademies({ page, limit: 10, search: search || undefined });
      setAcademies(result.items as AcademyRow[]);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void loadAcademies();
  }, [loadAcademies]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete organization "${name}" and all its branches?`)) return;

    try {
      await deleteAcademy(id);
      await loadAcademies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete organization");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground transition-colors">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
              Organization
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Organizations</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#5b4a4b]">
              Manage your organization network. Every module belongs to a branch, never directly to an organization.
            </p>
          </div>
          <Link
            href="/organizations/new"
            className="inline-flex items-center justify-center rounded-2xl bg-[#470004] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6a0006]"
          >
            Create organization
          </Link>
        </div>

        <div className="mt-8 rounded-[32px] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring sm:max-w-sm"
              placeholder="Search by name, slug, or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />

            <Link
              href="/dashboard"
              className="text-sm font-medium text-primary transition-colors hover:text-secondary"
            >
              Back to dashboard
            </Link>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Slug</th>
                  <th className="px-3 py-3">Timezone</th>
                  <th className="px-3 py-3">Branches</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      Loading organizations...
                    </td>
                  </tr>
                ) : academies.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No organizations yet. Create your first organization to get
                      started.
                    </td>
                  </tr>
                ) : (
                  academies.map((academy) => (
                    <tr
                      key={academy.id}
                      className="border-b border-border"
                    >
                      <td className="px-3 py-4 font-medium text-foreground">
                        {academy.name}
                      </td>

                      <td className="px-3 py-4 text-muted-foreground">
                        {academy.slug}
                      </td>

                      <td className="px-3 py-4 text-muted-foreground">
                        {academy.timezone}
                      </td>

                      <td className="px-3 py-4 text-foreground">
                        {academy._count?.branches ?? 0}
                      </td>

                      <td className="px-3 py-4">
                        <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold uppercase text-secondary-foreground">
                          {academy.status}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/organizations/${academy.id}`}
                            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-ring hover:text-primary"
                          >
                            View
                          </Link>

                          <Link
                            href={`/organizations/${academy.id}/branches/new`}
                            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-ring hover:text-primary"
                          >
                            Add branch
                          </Link>

                          <button
                            type="button"
                            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                            onClick={() =>
                              void handleDelete(academy.id, academy.name)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              disabled={page <= 1 || loading}
              className="rounded-xl border border-border px-4 py-2 text-foreground transition-colors hover:border-ring disabled:opacity-40"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-border px-4 py-2 text-foreground transition-colors hover:border-ring disabled:opacity-40"
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
