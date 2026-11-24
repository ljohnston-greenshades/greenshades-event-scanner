// Hand-raiser ("wants a demo") support.
//
// DEMO_FOCUS_OPTIONS values must match the HubSpot contact property
// `demo_focus_area` (multi-select) option values EXACTLY — Clay writes them
// straight through, joined with ";" as HubSpot expects for multi-selects.
// `label` is just the shorter text shown on the phone.

export const DEMO_FOCUS_OPTIONS = [
  { value: "Payroll processing", label: "Payroll" },
  { value: "Tax filing and compliance", label: "Tax & compliance" },
  { value: "HR, onboarding, or benefits", label: "HR & benefits" },
  { value: "Time and attendance", label: "Time & attendance" },
  { value: "Year-end forms", label: "Year-end forms" },
  { value: "Other", label: "Other" },
] as const;

const ALLOWED = new Set<string>(DEMO_FOCUS_OPTIONS.map((o) => o.value));

/** Keep only known focus values (guards against stale/forged client data). */
export function cleanDemoFocus(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (v): v is string => typeof v === "string" && ALLOWED.has(v),
  );
}
