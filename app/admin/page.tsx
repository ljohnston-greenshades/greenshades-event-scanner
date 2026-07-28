"use client";

import { useCallback, useState } from "react";
import type { RepStat, Stats } from "@/lib/stats";
import { formatEventName } from "@/lib/format";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authedKey, setAuthedKey] = useState<string | null>(null);
  const [event, setEvent] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (ev: string, adminKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/stats?event=${encodeURIComponent(ev)}`,
        { headers: { "x-admin-key": adminKey } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats.");
      setStats(data as Stats);
      setAuthedKey(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  function onLogin(e: React.FormEvent) {
    e.preventDefault();
    fetchStats(event, key);
  }

  function onEventChange(ev: string) {
    setEvent(ev);
    if (authedKey) fetchStats(ev, authedKey);
  }

  // --- Login gate ---------------------------------------------------------
  if (!authedKey || !stats) {
    return (
      <div className="mx-auto max-w-sm py-16">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            Admin leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the admin password to view scans by rep.
          </p>
          <form onSubmit={onLogin} className="mt-4 space-y-3">
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
              {loading ? "Loading…" : "View leaderboard"}
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

  // --- Leaderboard --------------------------------------------------------
  const leader = stats.reps[0];
  const maxCount = leader?.count ?? 0;

  return (
    <div className="space-y-8">
      {/* Title + event filter */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {event
              ? `Scans at ${formatEventName(event)}`
              : "Scans across all events"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="event" className="text-sm text-gray-500">
            Event
          </label>
          <select
            id="event"
            value={event}
            onChange={(e) => onEventChange(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">All events</option>
            {stats.events.map((ev) => (
              <option key={ev} value={ev}>
                {formatEventName(ev)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total scans" value={stats.total.toLocaleString()} />
        <StatTile label="Active reps" value={String(stats.reps.length)} />
        <StatTile label="Leader" value={leader ? leader.repName : "—"} />
      </div>

      {/* Ranked list */}
      {stats.reps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          No scans recorded {event ? "for this event " : ""}yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {stats.reps.map((rep, i) => (
            <LeaderRow key={rep.repId} rep={rep} rank={i} maxCount={maxCount} />
          ))}
        </ol>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-gray-400">Refreshing…</p>}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function LeaderRow({
  rep,
  rank,
  maxCount,
}: {
  rep: RepStat;
  rank: number;
  maxCount: number;
}) {
  const isTop = rank === 0;
  const pct = maxCount > 0 ? Math.round((rep.count / maxCount) * 100) : 0;

  return (
    <li
      className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
        isTop ? "border-brand ring-1 ring-brand" : "border-gray-200"
      }`}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center text-lg font-bold text-gray-400">
        {rank < MEDALS.length ? MEDALS[rank] : rank + 1}
      </div>

      {/* Avatar */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isTop ? "bg-brand text-white" : "bg-brand-light text-brand-dark"
        }`}
      >
        {initials(rep.repName)}
      </div>

      {/* Name + bar */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-semibold text-gray-900">
            {rep.repName}
          </span>
          <span className="shrink-0 tabular-nums text-sm text-gray-500">
            {rep.count.toLocaleString()} scan{rep.count === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </li>
  );
}
