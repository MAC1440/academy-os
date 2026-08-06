"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getBranch, updateBranch } from "@web/lib/api";

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams<{ academyId: string; branchId: string }>();
  const academyId = params.academyId;
  const branchId = params.branchId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    getBranch(branchId)
      .then((branch) => {
        setForm({
          name: branch.name,
          address: branch.address ?? "",
          city: branch.city ?? "",
          country: branch.country ?? "",
          phone: branch.phone ?? "",
          email: branch.email ?? "",
          status: branch.status ?? "ACTIVE",
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load branch");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [branchId]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await updateBranch(branchId, {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        status: form.status,
      });

      router.push(`/organizations/${academyId}/branches/${branchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update branch");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <div className="mx-auto max-w-2xl text-center text-[#5b4a4b]">
          Loading branch details...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/organizations/${academyId}/branches/${branchId}`}
          className="text-sm font-medium text-[#a67c00]"
        >
          ← Back to branch
        </Link>

        <div className="mt-6 rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
            Branch settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Edit Branch</h1>
          <p className="mt-2 text-sm text-[#5b4a4b]">
            Update campus details and operational status.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium">Branch name</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Address</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">City</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Country</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  type="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-3 pt-2">
              <Link
                href={`/organizations/${academyId}/branches/${branchId}`}
                className="rounded-2xl border border-[#470004]/15 px-5 py-3 text-sm font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-[#470004] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
