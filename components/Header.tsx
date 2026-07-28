"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

/**
 * App header: Greenshades logo on the left, and — when the app is opened with
 * an `event=` query param — the event name on the right as a visual
 * confirmation for the rep that scans are being tagged. Dashes in the param
 * are shown as spaces (e.g. ?event=HR-Tech-2026 → "HR Tech 2026").
 */
export function Header() {
  const [eventLabel, setEventLabel] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("event");
    if (value) setEventLabel(value.replace(/-/g, " "));
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <Logo className="h-8 w-auto shrink-0" />
      {eventLabel && (
        <span className="truncate text-right text-sm font-medium text-gray-500">
          {eventLabel}
        </span>
      )}
    </header>
  );
}
