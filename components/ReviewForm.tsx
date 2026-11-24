"use client";

import { InputHTMLAttributes } from "react";
import { Contact } from "@/lib/types";
import { DEMO_FOCUS_OPTIONS } from "@/lib/demo";

type TextKey = "firstName" | "lastName" | "company" | "jobTitle" | "email" | "phone";

type Field = {
  key: TextKey;
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
 * "Wants a demo" switch. Off by default so casual / vendor / partner scans stay
 * casual. When on, reveals optional demo-focus chips (HubSpot demo_focus_area).
 */
function HandRaiseToggle({
  contact,
  onChange,
}: {
  contact: Contact;
  onChange: (contact: Contact) => void;
}) {
  const on = contact.handRaiser;

  function toggle() {
    // Turning it off also clears focus so nothing stale rides along.
    onChange({ ...contact, handRaiser: !on, demoFocus: on ? [] : contact.demoFocus });
  }

  function toggleFocus(value: string) {
    const has = contact.demoFocus.includes(value);
    onChange({
      ...contact,
      demoFocus: has
        ? contact.demoFocus.filter((v) => v !== value)
        : [...contact.demoFocus, value],
    });
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        on ? "border-brand bg-brand-light" : "border-gray-300 bg-white"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block font-semibold text-gray-900">
            🙋 Wants a demo
          </span>
          <span className="block text-xs text-gray-500">
            Hand-raiser: flags them for sales follow-up. Leave off for casual,
            vendor, or partner scans.
          </span>
        </span>
        <span
          aria-hidden
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            on ? "bg-brand" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              on ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {on && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600">
            What should the demo focus on? <span className="text-gray-400">(optional)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_FOCUS_OPTIONS.map((o) => {
              const picked = contact.demoFocus.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => toggleFocus(o.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    picked
                      ? "border-brand bg-brand text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
          placeholder="e.g. switching vendors in Q1, follow up next week"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <HandRaiseToggle contact={contact} onChange={onChange} />

      {/* Populated from query params; not shown to the rep. */}
      <input type="hidden" name="event" value={contact.event} readOnly />
      <input type="hidden" name="rep_name" value={contact.repName} readOnly />
      <input type="hidden" name="rep_id" value={contact.repId} readOnly />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {submitting
          ? "Saving…"
          : contact.handRaiser
            ? "Save hand-raiser 🙋"
            : "Save contact"}
      </button>
    </form>
  );
}
