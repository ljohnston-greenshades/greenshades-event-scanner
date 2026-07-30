"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventRecord } from "@/lib/events";
import { readAdminKey, saveAdminKey } from "@/lib/adminKey";
import { RepMultiSelect } from "@/components/RepMultiSelect";

type EventWithReps = EventRecord & {
  repIds: string[];
  activeToday: boolean;
  todayInEventTz: string;
};
type Rep = { id: string; name: string };

const TIMEZONES = [
  ["America/New_York", "Eastern"],
  ["America/Chicago", "Central"],
  ["America/Denver", "Mountain"],
  ["America/Phoenix", "Arizona"],
  ["America/Los_Angeles", "Pacific"],
];

const emptyForm = {
  slug: null as string | null,
  name: "",
  startDate: "",
  endDate: "",
  timezone: "America/New_York",
  repIds: [] as string[],
};

export default function EventsAdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<EventWithReps[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (adminKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        headers: { "x-admin-key": adminKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load events.");
      setEvents(data.events as EventWithReps[]);
      setReps(data.reps as Rep[]);
      setAuthed(true);
      saveAdminKey(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = readAdminKey();
    if (saved) {
      setKey(saved);
      load(saved);
    }
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": key },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event.");
      setForm(emptyForm);
      await load(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(slug: string) {
    if (!window.confirm(`Delete this event? Scans already tagged keep their tag.`))
      return;
    try {
      const res = await fetch(`/api/admin/events?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: { "x-admin-key": key },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete.");
      }
      if (form.slug === slug) setForm(emptyForm);
      await load(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function edit(ev: EventWithReps) {
    setForm({
      slug: ev.slug,
      name: ev.name,
      startDate: ev.startDate,
      endDate: ev.endDate,
      timezone: ev.timezone,
      repIds: ev.repIds,
    });
  }

  // --- Login gate ---------------------------------------------------------
  if (!authed) {
    return (
      <div className="mx-auto max-w-sm py-16">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the admin password to manage events.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(key);
            }}
            className="mt-4 space-y-3"
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={loading || !key}
              className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Loading…" : "Manage events"}
            </button>
          </form>
          {error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Manager ------------------------------------------------------------
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Events</h1>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Event list */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              No events yet. Add one on the right.
            </p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.slug}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{ev.name}</p>
                      {ev.activeToday ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand-dark">
                          <span aria-hidden>●</span> Active now
                        </span>
                      ) : ev.todayInEventTz < ev.startDate ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Upcoming
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                          Ended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {ev.startDate} → {ev.endDate} · {ev.timezone}
                    </p>
                    {!ev.activeToday && (
                      <p className="mt-0.5 text-xs text-amber-600">
                        Won&apos;t appear in the scanner today ({ev.todayInEventTz}
                        {" "}in {ev.timezone}). Only events live right now show up.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-3 text-sm">
                    <button
                      onClick={() => edit(ev)}
                      className="font-medium text-brand"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(ev.slug)}
                      className="font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {ev.repIds.length === 0
                    ? "No reps assigned"
                    : `Reps: ${ev.repIds
                        .map((id) => reps.find((r) => r.id === id)?.name || id)
                        .join(", ")}`}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add / edit form */}
        <form
          onSubmit={save}
          className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">
            {form.slug ? "Edit event" : "Add event"}
          </h2>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. HR Tech 2026"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Start</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">End</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Timezone</span>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {TIMEZONES.map(([tz, label]) => (
                <option key={tz} value={tz}>
                  {label} ({tz})
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-sm font-medium text-gray-700">
              Attending reps
            </span>
            <div className="mt-1">
              <RepMultiSelect
                reps={reps}
                selected={form.repIds}
                onChange={(ids) => setForm((f) => ({ ...f, repIds: ids }))}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {form.repIds.length} selected
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : form.slug ? "Save changes" : "Add event"}
            </button>
            {form.slug && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
