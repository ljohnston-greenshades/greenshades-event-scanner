// Casing helpers shared by the header event label and the OCR post-processing.
//
// True "is this an English word vs an acronym" detection needs a dictionary,
// which isn't practical to ship to the browser. Instead we use two reliable
// signals: a curated acronym allowlist (extend it below), and the casing the
// source itself uses (an all-caps token is treated as an acronym). Everything
// else is title-cased. The human-in-the-loop review step is the backstop for
// the rare edge case.

/**
 * Acronyms that should render fully capitalized when they appear as a
 * standalone word — used for both event names and company names. Skewed toward
 * the HR / payroll / benefits space Greenshades sells into. Add as needed.
 */
const ACRONYMS = new Set([
  "hr", "hcm", "peo", "aca", "shrm", "isv", "smb", "erp", "crm", "it",
  "us", "usa", "uk", "fsa", "hsa", "hdhp", "api", "sap", "adp", "ukg", "llc",
]);

function titleCaseWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function titleCaseParts(word: string): string {
  // Capitalize each part around hyphens and apostrophes:
  // "anne-marie" -> "Anne-Marie", "o'brien" -> "O'Brien".
  return word
    .split(/([-'])/)
    .map((part) => (part === "-" || part === "'" ? part : titleCaseWord(part)))
    .join("");
}

function hasVowel(word: string): boolean {
  return /[aeiouy]/i.test(word);
}

/** All letters share one case (all upper or all lower) — i.e. not intentional mixed case. */
function isShouting(s: string): boolean {
  if (!/[a-z]/i.test(s)) return false;
  return s === s.toUpperCase() || s === s.toLowerCase();
}

function isAllCapsToken(token: string): boolean {
  return token.length >= 2 && token === token.toUpperCase() && /[A-Z]/.test(token);
}

/**
 * Format an `event=` slug for display: dashes/underscores become spaces, each
 * English word is title-cased, and acronyms are fully capitalized.
 * e.g. "HR-Tech-2026" -> "HR Tech 2026", "shrm-summit" -> "SHRM Summit".
 */
export function formatEventName(raw: string): string {
  return raw
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (/^\d+$/.test(token)) return token; // pure numbers unchanged (years)
      if (ACRONYMS.has(token.toLowerCase())) return token.toUpperCase();
      if (isAllCapsToken(token)) return token.toUpperCase(); // author capitalized it
      return titleCaseWord(token);
    })
    .join(" ");
}

/**
 * Normalize a person's name so the first letter of each part is capitalized.
 * Only reshapes ALL-CAPS or all-lowercase input; intentional mixed case
 * (McDonald, O'Brien, DeShawn) is preserved.
 */
export function normalizeName(value: string): string {
  const t = value.trim();
  if (!t || !isShouting(t)) return t;
  return t.split(/\s+/).map(titleCaseParts).join(" ");
}

/**
 * Normalize a company name: title-case it and de-shout ALL-CAPS names
 * ("ACME MANUFACTURING" -> "Acme Manufacturing") while keeping genuine
 * acronyms/brands intact (IBM, ADP, SAP, KPMG, eBay, AT&T). Only reshapes
 * ALL-CAPS / all-lowercase input; intentional mixed case is preserved.
 */
export function normalizeCompany(value: string): string {
  const t = value.trim();
  if (!t || !isShouting(t)) return t;
  return t
    .split(/\s+/)
    .map((word) => {
      if (ACRONYMS.has(word.toLowerCase())) return word.toUpperCase();
      // Keep a token that's already uppercase in the source when it looks like
      // an acronym/brand: short (<=3 letters, e.g. IBM, SAP, AT&T) or vowelless
      // (e.g. KPMG). Longer pronounceable all-caps words (ACME, ORACLE) get
      // de-shouted. Lowercase tokens are always title-cased.
      const letters = word.replace(/[^a-z]/gi, "");
      const isUpper = word === word.toUpperCase();
      if (isUpper && letters.length >= 2 && (letters.length <= 3 || !hasVowel(letters))) {
        return word.toUpperCase();
      }
      return titleCaseParts(word);
    })
    .join(" ");
}
