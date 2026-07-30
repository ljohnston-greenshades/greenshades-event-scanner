"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { repNameForId } from "@/lib/reps";
import { formatEventName } from "@/lib/format";

export type EventOption = { slug: string; name: string };

type EventContextValue = {
  repId: string;
  repName: string;
  eventSlug: string;
  eventName: string;
  /** Concurrent events the rep can switch between (includes the current one). */
  options: EventOption[];
  choose: (slug: string) => void;
};

const EventContext = createContext<EventContextValue | null>(null);

export function useEventContext(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventContext used outside EventProvider");
  return ctx;
}

// Remembers a same-day override so a relaunch keeps the rep's choice; it's only
// applied if still among today's concurrent options, so it self-expires.
const OVERRIDE_KEY = "gs_event_slug";

/**
 * Resolves the current event for the rep at launch:
 *  - `?event=` in the URL wins (explicit override, e.g. a booth QR) — fixed.
 *  - otherwise the schedule decides, based on `?rep=` and today's date.
 * The event is never taken from a baked PWA start URL beyond an explicit
 * `?event=`, so installs only need `?rep=`.
 */
export function EventProvider({ children }: { children: ReactNode }) {
  const [repId, setRepId] = useState("");
  const [repName, setRepName] = useState("");
  const [options, setOptions] = useState<EventOption[]>([]);
  const [eventSlug, setEventSlug] = useState("");
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rep = params.get("rep") ?? "";
    const explicit = params.get("event") ?? "";

    setRepId(rep);
    setRepName(repNameForId(rep));

    if (explicit) {
      const name = formatEventName(explicit);
      setEventSlug(explicit);
      setEventName(name);
      setOptions([{ slug: explicit, name }]);
      return;
    }
    if (!rep) return; // no rep → no schedule → scans stay untagged

    (async () => {
      try {
        const res = await fetch(
          `/api/events/active?rep=${encodeURIComponent(rep)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          selected: EventOption | null;
          alternatives: EventOption[];
        };
        if (!data.selected) return;

        const opts = [data.selected, ...data.alternatives];
        setOptions(opts);

        let chosen = data.selected;
        try {
          const saved = localStorage.getItem(OVERRIDE_KEY);
          const match = saved && opts.find((o) => o.slug === saved);
          if (match) chosen = match;
        } catch {
          /* ignore storage errors */
        }
        setEventSlug(chosen.slug);
        setEventName(chosen.name);
      } catch {
        /* offline / not configured → untagged */
      }
    })();
  }, []);

  function choose(slug: string) {
    const opt = options.find((o) => o.slug === slug);
    if (!opt) return;
    setEventSlug(opt.slug);
    setEventName(opt.name);
    try {
      localStorage.setItem(OVERRIDE_KEY, slug);
    } catch {
      /* ignore */
    }
  }

  return (
    <EventContext.Provider
      value={{ repId, repName, eventSlug, eventName, options, choose }}
    >
      {children}
    </EventContext.Provider>
  );
}
