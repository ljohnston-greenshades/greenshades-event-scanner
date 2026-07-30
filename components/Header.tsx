"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useEventContext } from "@/components/EventProvider";

/**
 * App header: Greenshades logo on the left, the current event on the right.
 * When the rep is assigned to more than one event running concurrently, the
 * event chip becomes a button that opens a dialog to switch between just those
 * concurrent events.
 */
export function Header() {
  const { eventName, eventSlug, options, choose } = useEventContext();
  const [open, setOpen] = useState(false);
  const canOverride = options.length > 1;

  return (
    <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <Logo className="h-8 w-auto shrink-0" />

      {eventName &&
        (canOverride ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 truncate text-right text-sm font-medium text-brand-dark"
          >
            <span className="truncate">{eventName}</span>
            <span aria-hidden className="shrink-0 text-gray-400">
              ▾
            </span>
          </button>
        ) : (
          <span className="truncate text-right text-sm font-medium text-gray-500">
            {eventName}
          </span>
        ))}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-900">Switch event</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Only events happening right now are shown.
            </p>
            <div className="mt-3 space-y-1">
              {options.map((o) => {
                const current = o.slug === eventSlug;
                return (
                  <button
                    key={o.slug}
                    type="button"
                    onClick={() => {
                      choose(o.slug);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                      current
                        ? "bg-brand-light font-semibold text-brand-dark"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">{o.name}</span>
                    {current && <span aria-hidden>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
