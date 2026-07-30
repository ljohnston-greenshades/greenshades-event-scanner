import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Dynamic web manifest. iOS (16.4+) launches an installed PWA at the manifest's
 * `start_url`, not the tab URL — so we bake the rep into `start_url` here. The
 * scanner page links this manifest with `?rep=<id>`, so the installed app keeps
 * the rep. No `event` is ever included (that's resolved from the schedule).
 */
export function GET(req: NextRequest) {
  const rep = req.nextUrl.searchParams.get("rep") ?? "";
  const startUrl = rep ? `/?rep=${encodeURIComponent(rep)}` : "/";

  const manifest = {
    name: "GreenScan",
    short_name: "GreenScan",
    description:
      "Scan a trade-show badge, review the details, and push to HubSpot.",
    id: "/?source=pwa",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#00843D",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "content-type": "application/manifest+json",
      // Vary so a rep-specific manifest isn't served from a shared cache.
      "cache-control": "no-store",
    },
  });
}
