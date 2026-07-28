// Maps a HubSpot owner ID (passed as ?rep=<id>) to the sales rep's name.
// Keep this in sync with the reps who use the scanner.
export const REPS: Record<string, string> = {
  "91529343": "Matt Murdock",
  "82728305": "Dylan Rattigan",
  "51872865": "Jodi Thibedeau",
  "51549607": "Will DiGiovanni",
  "82542702": "Joe Pritchard",
  "74289751": "Alanna Gravely",
};

/** Full rep name for a HubSpot ID, or "" if unknown. */
export function repNameForId(id: string | null | undefined): string {
  if (!id) return "";
  return REPS[id] ?? "";
}

/** First token of a name, for greetings ("Matt Murdock" -> "Matt"). */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}
