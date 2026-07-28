import { Contact } from "./types";

/**
 * Forward a reviewed contact to Clay via a webhook source URL.
 *
 * A Clay table listens on this URL, enriches the sparse badge data
 * (email, title, LinkedIn, firmographics from just name + company), and
 * then forwards the enriched record to HubSpot from inside Clay.
 *
 * Requires CLAY_WEBHOOK_URL. Throws on a non-2xx response.
 */
export async function sendToClay(contact: Contact): Promise<void> {
  const url = process.env.CLAY_WEBHOOK_URL;
  if (!url) {
    throw new Error("CLAY_WEBHOOK_URL is not configured");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Clay webhook returned ${res.status}: ${detail}`);
  }
}
