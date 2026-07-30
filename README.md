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
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (Vercel Marketplace KV) for per-rep scan counts. Injected by the integration. | Admin only |
| `ADMIN_PASSWORD` | Password for the `/admin` panel. Unset = panel disabled. | Admin only |

## Query parameters & event resolution

Reps install the PWA from a **rep-only** link: `…/?rep=<hubspotId>`. That's the
only param that should be baked into the home-screen install — on iOS the launch
URL is frozen at install time, so an `event` baked in would lock the app to one
show forever.

| Param | Effect |
| --- | --- |
| `?rep=<hubspotId>` | Attributes scans to a rep (see `lib/reps.ts`); greets them, tags contacts with `rep_name` / `rep_id`, and drives event resolution. |
| `?event=<slug>` | **Optional explicit override** (e.g. a booth QR). Fixed for the session; skips schedule resolution. |

**The event is normally resolved automatically at launch** from the schedule the
events manager configures (see below): the app looks up which event the rep is
assigned to that's running today (in the event's timezone). If the rep is
assigned to more than one concurrent event, the header event chip opens a dialog
to switch between just those. No `event` is taken from the baked URL.

## Events & scheduling

Events managers use **`/admin/events`** (same admin password) to create events
(name, date range, timezone) and check off which reps attend each one. This
schedule powers the automatic event resolution above and the leaderboard's event
filter. Events + assignments are stored in Upstash Redis alongside the scan
counts.

## Admin panel

`/admin` shows scans per rep, gated by `ADMIN_PASSWORD`. Counts are incremented
on each submission and stored as integers in Upstash Redis (no PII). Enable the
Redis integration in Vercel (Storage → Marketplace) and set `ADMIN_PASSWORD`;
without them, counting is a no-op and the panel reports it's not configured.
The page is not linked from the scanner.

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
