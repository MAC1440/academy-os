"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getAcademy, updateAcademy } from "@web/lib/api";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "PKR", "INR", "AUD"];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function EditAcademyPage() {
  const router = useRouter();
  const params = useParams<{ academyId: string }>();
  const academyId = params.academyId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo: "",
    email: "",
    phone: "",
    website: "",
    timezone: "UTC",
    currency: "USD",
    status: "ACTIVE",
  });

  useEffect(() => {
    getAcademy(academyId)
      .then((academy) => {
        setForm({
          name: academy.name,
          slug: academy.slug,
          logo: academy.logo ?? "",
          email: academy.email ?? "",
          phone: academy.phone ?? "",
          website: academy.website ?? "",
          timezone: academy.timezone ?? "UTC",
          currency: academy.currency ?? "USD",
          status: academy.status ?? "ACTIVE",
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load academy");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [academyId]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await updateAcademy(academyId, {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        logo: form.logo.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        timezone: form.timezone,
        currency: form.currency,
        status: form.status,
      });

      router.push(`/organizations/${academyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update academy");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
        <div className="mx-auto max-w-2xl text-center text-[#5b4a4b]">
          Loading academy details...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/organizations/${academyId}`}
          className="text-sm font-medium text-[#a67c00]"
        >
          ← Back to academy
        </Link>

        <div className="mt-6 rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
            Academy settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Edit Academy</h1>
          <p className="mt-2 text-sm text-[#5b4a4b]">
            Update your organization profile and global settings.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium">Academy name</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Slug</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="unique-slug"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Logo URL</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.logo}
                onChange={(e) => updateField("logo", e.target.value)}
                placeholder="https://example.com/logo.png"
                type="url"
              />
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="Academy logo preview"
                  className="mt-4 h-16 w-16 rounded-2xl border border-[#470004]/10 object-cover"
                />
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  type="email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Website</label>
              <input
                className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                type="url"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Timezone</label>
                <select
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.timezone}
                  onChange={(e) => updateField("timezone", e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Currency</label>
                <select
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
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
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-3 pt-2">
              <Link
                href={`/organizations/${academyId}`}
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
