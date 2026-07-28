import { NextRequest, NextResponse } from "next/server";
import { Contact, SubmitResult } from "@/lib/types";
import { sendToClay } from "@/lib/clay";
import { recordScan } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort per-rep tally. Never let a stats failure block the submission.
async function tallyScan(contact: Contact) {
  try {
    await recordScan(contact.repId, contact.repName, contact.event);
  } catch {
    // ignore
  }
}

/**
 * POST /api/contacts
 * Body: Contact (the reviewed, human-approved record)
 * Returns: SubmitResult
 *
 * The reviewed contact is handed off to Clay via a webhook. Clay owns the rest
 * of the pipeline: enrich the sparse badge data, look the person up in HubSpot,
 * then update the existing contact or create a new one (upsert).
 *
 * If CLAY_WEBHOOK_URL is not configured, the record is accepted as a no-op mock
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

  if (!process.env.CLAY_WEBHOOK_URL) {
    // Nothing configured yet — accept as a mock so previews work.
    await tallyScan(contact);
    return NextResponse.json<SubmitResult>({
      ok: true,
      destination: "mock",
      message: "No Clay webhook configured — contact accepted but not sent.",
    });
  }

  try {
    await sendToClay(contact);
    await tallyScan(contact);
    return NextResponse.json<SubmitResult>({
      ok: true,
      destination: "clay",
      message: "Sent to Clay for enrichment and sync to HubSpot.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submit failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
