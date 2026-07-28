import { Logo } from "@/components/Logo";

/** Desktop-oriented shell for the admin panel: wide column, its own header. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo className="h-8 w-auto" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Admin
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
