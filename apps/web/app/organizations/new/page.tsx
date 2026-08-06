"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createAcademy } from "@web/lib/api";

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

const STEPS = ["Academy name", "Logo", "Contact", "Timezone", "Review"];

export default function NewAcademyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logo: "",
    email: "",
    phone: "",
    website: "",
    timezone: "UTC",
    currency: "USD",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function nextStep() {
    if (step === 0 && form.name.trim().length < 2) {
      setError("Academy name must be at least 2 characters.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function prevStep() {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const academy = await createAcademy({
        name: form.name.trim(),
        logo: form.logo.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        timezone: form.timezone,
        currency: form.currency,
      });

      router.push(`/organizations/${academy.id}/branches/new?welcome=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create academy");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-16 text-[#470004]">
      <div className="mx-auto max-w-3xl">
        <Link href="/organizations" className="text-sm font-medium text-[#a67c00]">
          ← Back to academies
        </Link>

        <div className="mt-6 rounded-[32px] border border-[#470004]/10 bg-white p-8 shadow-[0_20px_60px_rgba(71,0,4,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a67c00]">
            Academy wizard
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Create your academy</h1>

          <div className="mt-8 flex flex-wrap gap-2">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] ${
                  index === step
                    ? "bg-[#470004] text-white"
                    : index < step
                      ? "bg-[#f3d58b]/50 text-[#470004]"
                      : "bg-[#fffdf8] text-[#5b4a4b] ring-1 ring-[#470004]/10"
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {step === 0 ? (
              <div>
                <label className="mb-2 block text-sm font-medium">Academy name</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Greenwood International Academy"
                  required
                  minLength={2}
                />
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <label className="mb-2 block text-sm font-medium">Logo URL</label>
                <input
                  className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                  value={form.logo}
                  onChange={(event) => updateField("logo", event.target.value)}
                  placeholder="https://example.com/logo.png"
                  type="url"
                />
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Academy logo preview"
                    className="mt-4 h-20 w-20 rounded-2xl border border-[#470004]/10 object-cover"
                  />
                ) : (
                  <p className="mt-3 text-sm text-[#5b4a4b]">
                    Optional. You can add or update the logo later.
                  </p>
                )}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    type="email"
                    placeholder="admin@academy.edu"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone</label>
                  <input
                    className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="+1 555 0100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Website</label>
                  <input
                    className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                    value={form.website}
                    onChange={(event) => updateField("website", event.target.value)}
                    type="url"
                    placeholder="https://academy.edu"
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Timezone</label>
                  <select
                    className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                    value={form.timezone}
                    onChange={(event) => updateField("timezone", event.target.value)}
                  >
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Currency</label>
                  <select
                    className="w-full rounded-2xl border border-[#470004]/15 bg-[#fffdf8] px-4 py-3 outline-none focus:border-[#a67c00]"
                    value={form.currency}
                    onChange={(event) => updateField("currency", event.target.value)}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="rounded-3xl border border-[#470004]/10 bg-[#fffdf8] p-6 text-sm">
                <h2 className="text-lg font-semibold">Review</h2>
                <dl className="mt-4 space-y-3">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Name</dt>
                    <dd className="font-medium">{form.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Logo</dt>
                    <dd className="font-medium">{form.logo || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Email</dt>
                    <dd className="font-medium">{form.email || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Phone</dt>
                    <dd className="font-medium">{form.phone || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Website</dt>
                    <dd className="font-medium">{form.website || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Timezone</dt>
                    <dd className="font-medium">{form.timezone}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#5b4a4b]">Currency</dt>
                    <dd className="font-medium">{form.currency}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap gap-3 pt-2">
              {step > 0 ? (
                <button
                  type="button"
                  className="rounded-2xl border border-[#470004]/15 px-5 py-3 text-sm font-semibold"
                  onClick={prevStep}
                  disabled={submitting}
                >
                  Back
                </button>
              ) : null}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="rounded-2xl bg-[#470004] px-5 py-3 text-sm font-semibold text-white"
                  onClick={nextStep}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-2xl bg-[#470004] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save academy"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
