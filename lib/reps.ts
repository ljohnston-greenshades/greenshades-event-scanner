// Maps a HubSpot owner ID (passed as ?rep=<id>) to the sales rep's name.
// Keep this in sync with the reps who use the scanner.
export const REPS: Record<string, string> = {
  "50579347": "Chris Hadden",
  "91588714": "Rachel Moberg",
  "93244045": "David Redding",
  "52127650": "Lauren DeBisschop",
  "79370309": "Grace Mondics",
  "87654889": "Bryan Lieber",
  "51549607": "Will DiGiovanni",
  "82163000": "Rodman Likes",
  "86029237": "Luke Johnston",
  "84373829": "Katherine Diersing",
  "51381152": "John Osberger",
  "82542702": "Joe Pritchard",
  "81787851": "Vincent Murdica",
  "51872865": "Jodi Thibedeau",
  "91529343": "Matt Murdock",
  "89055118": "Patricia Gloria",
  "68203965": "David Bielarski",
  "74289751": "Alanna Gravely",
  "51673099": "Jason Kools",
  "82094233": "Joshua McCullough",
  "82728305": "Dylan Rattigan",
  "68284729": "Walter Braithwaite",
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
