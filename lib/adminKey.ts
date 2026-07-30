// Shares the admin password across admin pages for the session (sessionStorage),
// so navigating Leaderboard <-> Events doesn't re-prompt. Cleared when the tab
// closes. Browser-only; safe to call during SSR (returns "").
const KEY = "gs_admin_key";

export function readAdminKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(KEY) ?? "";
}

export function saveAdminKey(value: string): void {
  if (typeof window === "undefined") return;
  if (value) sessionStorage.setItem(KEY, value);
  else sessionStorage.removeItem(KEY);
}
