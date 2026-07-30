"use client";

import { InputHTMLAttributes } from "react";
import { Contact } from "@/lib/types";

type Field = {
  key: keyof Contact;
  label: string;
  input?: InputHTMLAttributes<HTMLInputElement>;
};

// Per-field mobile keyboard/autofill hygiene so phones don't fight the rep —
// e.g. no auto-capitalizing or autocorrecting email addresses.
const FIELDS: Field[] = [
  {
    key: "firstName",
    label: "First name",
    input: { autoCapitalize: "words", autoComplete: "given-name" },
  },
  {
    key: "lastName",
    label: "Last name",
    input: { autoCapitalize: "words", autoComplete: "family-name" },
  },
  {
    key: "company",
    label: "Company",
    input: { autoCapitalize: "words", autoComplete: "organization" },
  },
  {
    key: "jobTitle",
    label: "Job title",
    input: { autoCapitalize: "words", autoComplete: "organization-title" },
  },
  {
    key: "email",
    label: "Email",
    input: {
      type: "email",
      inputMode: "email",
      autoCapitalize: "none",
      autoCorrect: "off",
      spellCheck: false,
      autoComplete: "email",
    },
  },
  {
    key: "phone",
    label: "Phone",
    input: { type: "tel", inputMode: "tel", autoComplete: "tel" },
  },
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
      {FIELDS.map(({ key, label, input }) => (
        <label key={key} className="block">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <input
            type="text"
            {...input}
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

      {/* Populated from query params; not shown to the rep. */}
      <input type="hidden" name="event" value={contact.event} readOnly />
      <input type="hidden" name="rep_name" value={contact.repName} readOnly />
      <input type="hidden" name="rep_id" value={contact.repId} readOnly />

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
