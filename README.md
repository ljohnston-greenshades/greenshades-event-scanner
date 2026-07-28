# Greenshades Event Scanner

Scan a trade-show badge with any phone or camera, OCR the details into a form,
review/correct them (human-in-the-loop), and hand the contact off to **Clay**,
which enriches it and syncs it to **HubSpot**.

This is a deployable Next.js app that builds green so it can be hosted on
Vercel. Integrations degrade gracefully to a demo mode when no keys are
configured, so a preview deploy works out of the box.

---

## The flow

```
 Camera  →  /api/ocr        →  Review form   →  /api/contacts  →  Clay ──► HubSpot
 (phone)    (Claude vision,     (rep confirms     (webhook           (enrich +   (upsert:
            structured JSON)     & completes)      handoff)           lookup)     update or create)
```

1. **Capture** — `components/BadgeScanner.tsx` opens the rear camera (or a file
   picker on desktop) and reads the photo as a data URL.
2. **OCR** — `POST /api/ocr` sends the image to Claude vision, which returns
   structured fields (first/last name, company, title, email, phone). The image
   is processed in-memory and **never persisted**.
3. **Review** — `components/ReviewForm.tsx` lets the rep fix misreads and fill
   gaps. Nothing leaves the device until they hit Save.
4. **Submit** — `POST /api/contacts` POSTs the reviewed contact to a Clay
   webhook. **Clay owns everything downstream.**

## Why these choices

- **Stack — Next.js + TypeScript + Tailwind on Vercel.** Serverless API routes
  keep every API key server-side (never shipped to the browser), and the app is
  a one-click Vercel deploy.
- **OCR — a vision LLM (Claude), not client-side Tesseract.** Badges vary wildly
  in layout; a vision model returns clean *structured* fields in one call, and
  the review step catches the occasional misread.
- **Destination — hand off to Clay, which upserts into HubSpot.** A badge often
  carries only name + company. Clay enriches that (email, title, LinkedIn,
  firmographics), then looks the person up in HubSpot and updates or creates the
  contact. Enriching *before* the lookup means the dedupe happens on the real
  email, so you don't create duplicates. The app itself has no HubSpot logic —
  it just hands off to Clay.

## PII handling

- No application database. The app is stateless; **Clay and HubSpot are the only
  stores.**
- Badge images live only in memory for the duration of the OCR call.
- All secrets are read server-side from environment variables (Vercel env), and
  every outbound call is HTTPS.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys (all optional for demo mode)
npm run dev                  # http://localhost:3000
```

With no keys set, OCR returns sample data and Save is a no-op — the whole flow
is still clickable.

### Deploying to Vercel

1. Import this repo in Vercel (framework is pinned to Next.js via `vercel.json`).
2. Add the environment variables below in the Vercel dashboard (Production, and
   Preview if you want previews to use real keys).
3. Deploy. Re-deploy after changing env vars — they're applied at deploy time.

## Configuration

All read server-side only. See `.env.example`.

| Variable | Purpose | Required |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Enables real OCR (Claude vision). | Yes |
| `CLAY_WEBHOOK_URL` | Clay source webhook; every reviewed contact is POSTed here. | Yes |
| `ANTHROPIC_MODEL` | OCR model; defaults to `claude-opus-5`. | No |

**HubSpot credentials live in Clay**, not here — Clay does the lookup and the
create/update, so its HubSpot integration needs a Private App token with
`crm.objects.contacts.read` **and** `crm.objects.contacts.write`.

## Project layout

```
app/
  layout.tsx            app shell
  page.tsx              capture → review → done state machine
  api/ocr/route.ts      badge image → structured contact
  api/contacts/route.ts reviewed contact → Clay webhook handoff
components/
  BadgeScanner.tsx      camera capture + preview
  ReviewForm.tsx        human-in-the-loop edit form
lib/
  types.ts              shared Contact / result types
  ocr.ts                Claude vision extraction (+ mock fallback)
  clay.ts               Clay webhook client
```

## Roadmap (post-scaffold)

- Build out the Clay table: enrich → HubSpot lookup → conditional update/create.
- Offline queue so scans survive spotty trade-show Wi-Fi.
- Multi-badge batch mode.
