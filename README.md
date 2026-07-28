# Greenshades Event Scanner

Scan a trade-show badge with any phone or camera, OCR the details into a form,
review/correct them (human-in-the-loop), and push the contact to **HubSpot** —
optionally enriched via **Clay** first.

This PR is the initial scaffold: a deployable Next.js app that builds green so
it can be connected to Vercel for hosting. Real integrations are wired but
degrade gracefully to a demo mode when no keys are configured, so a preview
deploy works out of the box.

---

## The flow

```
 Camera  →  /api/ocr        →  Review form   →  /api/contacts  →  Clay ──► HubSpot
 (phone)    (Claude vision,     (rep confirms     (pipeline)        (enrich)   (system
            structured JSON)     & completes)                                   of record)
                                                                   └────────► HubSpot
                                                                     (direct, if Clay off)
```

1. **Capture** — `components/BadgeScanner.tsx` opens the rear camera (or a file
   picker on desktop) and reads the photo as a data URL.
2. **OCR** — `POST /api/ocr` sends the image to Claude vision, which returns
   structured fields (first/last name, company, title, email, phone). The image
   is processed in-memory and **never persisted**.
3. **Review** — `components/ReviewForm.tsx` lets the rep fix misreads and fill
   gaps. Nothing leaves the device until they hit Save.
4. **Submit** — `POST /api/contacts` runs the destination pipeline (below).

## Why these choices

- **Stack — Next.js + TypeScript + Tailwind on Vercel.** Serverless API routes
  keep every API key server-side (never shipped to the browser), and the app is
  a one-click Vercel deploy.
- **OCR — a vision LLM (Claude), not client-side Tesseract.** Badges vary wildly
  in layout; a vision model returns clean *structured* fields in one call, and
  the review step catches the occasional misread.
- **Destination — Clay first, then HubSpot.** A badge often carries only
  name + company. Clay enriches that into email, title, LinkedIn, and
  firmographics before it lands in HubSpot, avoiding thin CRM records. The
  pipeline is pluggable — flip `ENRICH_VIA_CLAY` off to write straight to
  HubSpot.

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

1. Import this repo in Vercel (framework auto-detects as Next.js).
2. Add the environment variables from `.env.example` in the Vercel dashboard.
3. Deploy. Set `ENRICH_VIA_CLAY=true` once the Clay table is ready.

## Configuration

See `.env.example` for the full list. Summary:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables real OCR (Claude vision). |
| `ANTHROPIC_MODEL` | OCR model; defaults to `claude-opus-5`. |
| `ENRICH_VIA_CLAY` | `true` → enrich via Clay before HubSpot. |
| `CLAY_WEBHOOK_URL` | Clay source webhook the reviewed contact is POSTed to. |
| `HUBSPOT_ACCESS_TOKEN` | Private App token (`crm.objects.contacts.write`). |

## Project layout

```
app/
  layout.tsx            app shell
  page.tsx              capture → review → done state machine
  api/ocr/route.ts      badge image → structured contact
  api/contacts/route.ts reviewed contact → Clay/HubSpot pipeline
components/
  BadgeScanner.tsx      camera capture + preview
  ReviewForm.tsx        human-in-the-loop edit form
lib/
  types.ts              shared Contact / result types
  ocr.ts                Claude vision extraction (+ mock fallback)
  clay.ts               Clay webhook client
  hubspot.ts            HubSpot CRM client
```

## Roadmap (post-scaffold)

- Wire up real Clay + HubSpot credentials and confirm the enrichment path.
- Dedupe against existing HubSpot contacts before create.
- Offline queue so scans survive spotty trade-show Wi-Fi.
- Multi-badge batch mode.
