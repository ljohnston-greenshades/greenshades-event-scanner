import { NextRequest, NextResponse } from "next/server";
import { Contact, SubmitResult } from "@/lib/types";
import { createHubSpotContact } from "@/lib/hubspot";
import { sendToClay } from "@/lib/clay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/contacts
 * Body: Contact (the reviewed, human-approved record)
 * Returns: SubmitResult
 *
 * Pipeline (configurable via env):
 *   ENRICH_VIA_CLAY=true  → POST to Clay, which enriches and forwards to HubSpot
 *   otherwise             → create the contact directly in HubSpot
 *
 * If neither destination is configured, the record is accepted as a no-op mock
 * so the flow can be demoed on a fresh Vercel deploy.
 */
export async function POST(req: NextRequest) {
  let contact: Contact;
  try {
    contact = (await req.json()) as Contact;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!contact.firstName && !contact.lastName && !contact.company) {
    return NextResponse.json(
      { error: "A contact needs at least a name or a company." },
      { status: 400 },
    );
  }

  const enrichViaClay = process.env.ENRICH_VIA_CLAY === "true";

  try {
    if (enrichViaClay && process.env.CLAY_WEBHOOK_URL) {
      await sendToClay(contact);
      return NextResponse.json<SubmitResult>({
        ok: true,
        destination: "clay",
        message: "Sent to Clay for enrichment, then on to HubSpot.",
      });
    }

    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      await createHubSpotContact(contact);
      return NextResponse.json<SubmitResult>({
        ok: true,
        destination: "hubspot",
        message: "Contact created in HubSpot.",
      });
    }

    // Nothing configured yet — accept as a mock so previews work.
    return NextResponse.json<SubmitResult>({
      ok: true,
      destination: "mock",
      message:
        "No destination configured — contact accepted but not sent anywhere.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submit failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
