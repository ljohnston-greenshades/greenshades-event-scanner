// Shared types for the badge-scanning pipeline.

/**
 * The set of fields we try to capture from a badge and complete in review.
 * Everything is optional at OCR time — a badge may only carry first/last/company.
 */
export interface Contact {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  /** Free-text notes the rep adds during review (e.g. "wants a demo"). */
  notes: string;
  /**
   * Which event this scan came from, sourced from the `event=` query param
   * (e.g. open the app at `?event=HR-Tech-2026`). Carried through to Clay so
   * every contact is tagged with its trade show. Not shown in the UI.
   */
  event: string;
  /**
   * The sales rep who captured this lead. Sourced from the `rep=<hubspotId>`
   * query param and resolved to a name via lib/reps. Carried through to Clay
   * (as rep_name / rep_id) for per-rep tracking. Not shown in the form.
   */
  repName: string;
  repId: string;
  /**
   * Hand-raiser: the person asked for a Greenshades demo (vs. a casual,
   * vendor, or partner scan). Off by default; the rep opts in on review.
   */
  handRaiser: boolean;
  /** Optional demo focus areas (HubSpot `demo_focus_area` values). */
  demoFocus: string[];
  /** ISO timestamp of the hand-raise, stamped on save. "" when not a hand-raiser. */
  handRaisedAt: string;
}

export function emptyContact(): Contact {
  return {
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    email: "",
    phone: "",
    notes: "",
    event: "",
    repName: "",
    repId: "",
    handRaiser: false,
    demoFocus: [],
    handRaisedAt: "",
  };
}

/** Result returned by /api/ocr. */
export interface OcrResult {
  contact: Contact;
  /** true when the OCR was mocked (no ANTHROPIC_API_KEY configured). */
  mocked: boolean;
}

/** Result returned by /api/contacts. */
export interface SubmitResult {
  ok: boolean;
  /** Where the contact was handed off: "clay", or "mock" when not configured. */
  destination: "clay" | "mock";
  message: string;
}
