import type { Metadata } from "next";
import { Scanner } from "@/components/Scanner";

// Point the manifest link at a rep-specific manifest so the installed PWA's
// start_url keeps `?rep=` (iOS launches at the manifest start_url, not the tab
// URL). The interactive UI lives in the <Scanner/> client component.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const rep = typeof sp.rep === "string" ? sp.rep : "";
  const manifest = rep
    ? `/manifest.webmanifest?rep=${encodeURIComponent(rep)}`
    : "/manifest.webmanifest";
  return { manifest };
}

export default function Page() {
  return <Scanner />;
}
