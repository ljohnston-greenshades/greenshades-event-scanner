import { Header } from "@/components/Header";
import { EventProvider } from "@/components/EventProvider";

/** Mobile-first shell for the scanner: narrow column, logo/event header. */
export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EventProvider>
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <Header />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </EventProvider>
  );
}
