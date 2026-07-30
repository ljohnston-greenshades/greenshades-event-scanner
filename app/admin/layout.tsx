import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Desktop-oriented shell for the admin panel: wide column, header with nav. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Logo className="h-8 w-auto" />
            <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link href="/admin" className="hover:text-gray-900">
                Leaderboard
              </Link>
              <Link href="/admin/events" className="hover:text-gray-900">
                Events
              </Link>
            </nav>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Admin
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
