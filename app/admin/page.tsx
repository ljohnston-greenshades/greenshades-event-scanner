"use client";

import { useState } from "react";
import type { Stats } from "@/lib/stats";

/**
 * Password-gated admin panel showing scans per rep. Not linked from the app.
 * The password is checked server-side against ADMIN_PASSWORD; this page just
 * passes it through in the x-admin-key header.
 */
export default function AdminPage() {
  const [key, setKey] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStats(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": key },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats.");
      setStats(data as Stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Scans by rep</h2>

      <form onSubmit={load} className="flex gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin password"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={loading || !key}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Loading…" : "View"}
        </button>
      </form>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {stats && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {stats.total} total scan{stats.total === 1 ? "" : "s"} across{" "}
            {stats.reps.length} rep{stats.reps.length === 1 ? "" : "s"}.
          </p>
          {stats.reps.length === 0 ? (
            <p className="text-sm text-gray-500">No scans recorded yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 font-medium">Rep</th>
                  <th className="py-2 text-right font-medium">Scans</th>
                </tr>
              </thead>
              <tbody>
                {stats.reps.map((r) => (
                  <tr key={r.repId} className="border-b border-gray-100">
                    <td className="py-2">{r.repName}</td>
                    <td className="py-2 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
