"use client";

import { Contact } from "@/lib/types";

const FIELDS: { key: keyof Contact; label: string; type?: string }[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "company", label: "Company" },
  { key: "jobTitle", label: "Job title" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
];

/**
 * The human-in-the-loop review step. The rep confirms/corrects the OCR output
 * and fills in anything missing before the contact is sent onward.
 */
export function ReviewForm({
  contact,
  onChange,
  onSubmit,
  submitting,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {FIELDS.map(({ key, label, type }) => (
        <label key={key} className="block">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <input
            type={type ?? "text"}
            value={contact[key]}
            onChange={(e) => onChange({ ...contact, [key]: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
      ))}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Notes</span>
        <textarea
          value={contact.notes}
          onChange={(e) => onChange({ ...contact, notes: e.target.value })}
          rows={2}
          placeholder="e.g. wants a demo, follow up next week"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      {/* Populated from the `event=` query param; not shown to the rep. */}
      <input type="hidden" name="event" value={contact.event} readOnly />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save contact"}
      </button>
    </form>
  );
}
