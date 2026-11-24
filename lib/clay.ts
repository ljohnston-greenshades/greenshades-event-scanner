import { Contact } from "./types";
import { cleanDemoFocus } from "./demo";

/**
 * Build the webhook payload. Field names for the hand-raise block match the
 * HubSpot contact properties so the Clay → HubSpot mapping is 1:1.
 *
 * IMPORTANT: the `event_demo_*` / `demo_focus_area` keys are only present when
 * the rep flagged a hand-raiser. For casual scans they're omitted entirely —
 * never sent as false/empty — so a later casual re-scan can't erase an earlier
 * genuine hand-raise in HubSpot. `hand_raiser` is always sent (true/false) so
 * Clay can branch on it; it should NOT be mapped onto event_demo_interest.
 */
export function buildClayPayload(contact: Contact): Record<string, unknown> {
  const {
    repName,
    repId,
    handRaiser,
    demoFocus,
    handRaisedAt,
    ...rest
  } = contact;

  // Older installed clients may not send these fields — default safely.
  const isHandRaiser = handRaiser === true;

  const payload: Record<string, unknown> = {
    ...rest,
    rep_name: repName,
    rep_id: repId,
    hand_raiser: isHandRaiser,
  };

  if (isHandRaiser) {
    payload.event_demo_interest = true;
    payload.event_demo_handraise_date =
      handRaisedAt || new Date().toISOString();
    payload.event_demo_source = contact.event;
    const focus = cleanDemoFocus(demoFocus);
    if (focus.length) payload.demo_focus_area = focus.join(";");
  }

  return payload;
}

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

  const payload = buildClayPayload(contact);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Clay webhook returned ${res.status}: ${detail}`);
  }
}
