"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Rep = { id: string; name: string };

/**
 * Searchable multi-select for assigning reps to an event. Shows the current
 * selection as removable chips and opens a filterable checkbox list — scales
 * comfortably to the full rep roster where a flat checkbox grid doesn't.
 */
export function RepMultiSelect({
  reps,
  selected,
  onChange,
}: {
  reps: Rep[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside the control.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const sorted = useMemo(
    () => [...reps].sort((a, b) => a.name.localeCompare(b.name)),
    [reps],
  );
  const selectedReps = sorted.filter((r) => selected.includes(r.id));
  const q = query.trim().toLowerCase();
  const filtered = q
    ? sorted.filter((r) => r.name.toLowerCase().includes(q))
    : sorted;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-md border border-gray-300 px-2 py-1.5 text-left focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      >
        <span className="flex flex-wrap gap-1">
          {selectedReps.length === 0 ? (
            <span className="px-1 text-sm text-gray-400">Select reps…</span>
          ) : (
            selectedReps.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 rounded bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark"
              >
                {r.name}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${r.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(r.id);
                  }}
                  className="text-brand-dark/60 hover:text-brand-dark"
                >
                  ×
                </span>
              </span>
            ))
          )}
        </span>
        <span aria-hidden className="shrink-0 text-gray-400">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reps…"
              autoFocus
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <div className="mt-1.5 flex justify-between px-0.5 text-xs">
              <button
                type="button"
                onClick={() => onChange(sorted.map((r) => r.id))}
                className="font-medium text-brand hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-medium text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-56 overflow-auto p-1">
            {filtered.length === 0 ? (
              <p className="p-2 text-sm text-gray-400">No matches</p>
            ) : (
              filtered.map((r) => {
                const on = selected.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(r.id)}
                      className="rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    {r.name}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
