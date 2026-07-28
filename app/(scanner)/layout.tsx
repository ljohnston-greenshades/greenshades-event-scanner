import { Header } from "@/components/Header";

/** Mobile-first shell for the scanner: narrow column, logo/event header. */
export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <Header />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
