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
