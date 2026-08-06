"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createBranch, getAcademy } from "@web/lib/api";

export default function NewBranchPage() {
  const router = useRouter();
  const params = useParams<{ academyId: string }>();
  const searchParams = useSearchParams();
  const academyId = params.academyId;
  const isWelcome = searchParams.get("welcome") === "1";

  const [academyName, setAcademyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    getAcademy(academyId)
      .then((academy) => setAcademyName(academy.name))
      .catch(() => setError("Academy not found"));
  }, [academyId]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createBranch({
        academyId,
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      });

      router.push(`/organizations/${academyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/organizations/${academyId}`}
          className="text-sm font-medium text-[#a67c00]"
        >
          ← Back to {academyName || "academy"}
        </Link>

        <div className="mt-6 rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          {isWelcome ? (
            <div className="mb-6 rounded-2xl border border-[#f3d58b] bg-[#f3d58b]/20 p-4 text-sm">
              Academy saved. Now add your first branch — all future modules will belong to branches.
            </div>
          ) : null}

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
            Branch creation
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Add a branch</h1>
          <p className="mt-2 text-sm text-[#5b4a4b]">
            {academyName
              ? `Create a campus under ${academyName}.`
              : "Create a campus for this academy."}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium">Branch name</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Main Campus"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Address</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="123 Education Blvd"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">City</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Karachi"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Country</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Pakistan"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+92 300 0000000"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  type="email"
                  placeholder="campus@academy.edu"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#470004] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create branch"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
