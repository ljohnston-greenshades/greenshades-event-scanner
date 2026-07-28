"use client";

import { useState } from "react";
import { BadgeScanner } from "@/components/BadgeScanner";
import { ReviewForm } from "@/components/ReviewForm";
import { Contact, emptyContact, OcrResult, SubmitResult } from "@/lib/types";

type Phase = "capture" | "review" | "done";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("capture");
  const [contact, setContact] = useState<Contact>(emptyContact());
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function handleCapture(dataUrl: string) {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = (await res.json()) as OcrResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "OCR failed");

      setContact(data.contact);
      setBanner(
        data.mocked
          ? "Demo mode: no ANTHROPIC_API_KEY set, showing sample data."
          : null,
      );
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      const data = (await res.json()) as SubmitResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "Submit failed");

      setBanner(data.message);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setContact(emptyContact());
    setBanner(null);
    setError(null);
    setPhase("capture");
  }

  return (
    <div className="space-y-4">
      {banner && (
        <p className="rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">
          {banner}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {phase === "capture" && (
        <BadgeScanner onCapture={handleCapture} busy={scanning} />
      )}

      {phase === "review" && (
        <>
          <p className="text-sm text-gray-500">
            Check the details below, fix anything the scan got wrong, then save.
          </p>
          <ReviewForm
            contact={contact}
            onChange={setContact}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </>
      )}

      {phase === "done" && (
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-brand-dark">Saved ✓</p>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white"
          >
            Scan another badge
          </button>
        </div>
      )}
    </div>
  );
}
