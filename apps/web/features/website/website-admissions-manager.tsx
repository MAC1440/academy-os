'use client';

import { GraduationCap } from 'lucide-react';
import { useGetWebsiteAdmissionOfferingsQuery, type WebsiteSettings } from './website.api';

export function WebsiteAdmissionsManager({
  settings,
  onChange,
}: {
  settings: WebsiteSettings;
  onChange: (settings: WebsiteSettings) => void;
}) {
  const offerings = useGetWebsiteAdmissionOfferingsQuery();
  const update = (value: Partial<WebsiteSettings['admissions']>) =>
    onChange({ ...settings, admissions: { ...settings.admissions, ...value } });
  const selected = settings.admissions.eligibleOfferingIds;
  return (
    <section className="website-manager-section website-admissions-settings">
      <div className="website-manager-section-copy">
        <span className="website-manager-section-icon">
          <GraduationCap size={20} />
        </span>
        <div>
          <h2>Online admissions</h2>
          <p>Control when families can apply and which active classes appear publicly.</p>
        </div>
      </div>
      <div className="website-manager-fields">
        <div className="website-inline-checks md:col-span-2">
          <label>
            <input
              type="checkbox"
              checked={settings.admissions.enabled}
              onChange={(event) => update({ enabled: event.target.checked })}
            />{' '}
            Show admissions publicly
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.admissions.isOpen}
              onChange={(event) => update({ isOpen: event.target.checked })}
            />{' '}
            Applications are open
          </label>
        </div>
        <label className="grid gap-1.5 text-sm font-medium">
          Page heading
          <input
            className="field"
            maxLength={160}
            value={settings.admissions.heading}
            onChange={(event) => update({ heading: event.target.value })}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Confirmation message
          <input
            className="field"
            maxLength={500}
            value={settings.admissions.confirmationMessage}
            onChange={(event) => update({ confirmationMessage: event.target.value })}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
          Public introduction
          <textarea
            className="field min-h-24"
            maxLength={2000}
            value={settings.admissions.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </label>
        <fieldset className="website-offering-picker md:col-span-2">
          <legend>Eligible classes and courses</legend>
          {offerings.isLoading ? (
            <p>Loading active offerings…</p>
          ) : offerings.data?.length ? (
            offerings.data.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(event) =>
                    update({
                      eligibleOfferingIds: event.target.checked
                        ? [...selected, item.id]
                        : selected.filter((id) => id !== item.id),
                    })
                  }
                />
                <span>
                  <strong>
                    {item.name}
                    {item.sectionName ? ` · ${item.sectionName}` : ''}
                  </strong>
                  <small>{item.branchName}</small>
                </span>
              </label>
            ))
          ) : (
            <p>No active academic offerings are available.</p>
          )}
        </fieldset>
        {settings.admissions.enabled && !settings.admissions.isOpen ? (
          <p className="website-field-note md:col-span-2">
            The admissions page will show a clear “currently closed” message.
          </p>
        ) : null}
        {settings.admissions.enabled && settings.admissions.isOpen && !selected.length ? (
          <p className="website-field-warning md:col-span-2">
            Select at least one eligible class before publishing.
          </p>
        ) : null}
      </div>
    </section>
  );
}
