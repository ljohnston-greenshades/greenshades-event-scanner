"use client";

import { useEffect, useState } from "react";
import { BadgeScanner } from "@/components/BadgeScanner";
import { BadgeProof } from "@/components/BadgeProof";
import { ReviewForm } from "@/components/ReviewForm";
import { Contact, emptyContact, OcrResult, SubmitResult } from "@/lib/types";
import { firstNameOf, repNameForId } from "@/lib/reps";

type Phase = "capture" | "review" | "done";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("capture");
  const [contact, setContact] = useState<Contact>(emptyContact());
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [repName, setRepName] = useState("");
  const [repId, setRepId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Read the `event=` query param once on mount and tag every scan with it.
  // Read from window.location (not useSearchParams) to keep the page statically
  // prerenderable without a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const event = params.get("event");
    if (event) setEventName(event);

    const rep = params.get("rep");
    if (rep) {
      setRepId(rep);
      setRepName(repNameForId(rep));
    }
  }, []);

  async function handleCapture(dataUrl: string) {
    setScanning(true);
    setError(null);
    setCapturedImage(dataUrl);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = (await res.json()) as OcrResult & { error?: string };
      if (!res.ok) throw new Error(data.error || "OCR failed");

      setContact({ ...data.contact, event: eventName, repName, repId });
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

  // Skip OCR entirely and go straight to a blank review form.
  function handleManual() {
    setContact({ ...emptyContact(), event: eventName, repName, repId });
    setCapturedImage(null);
    setBanner(null);
    setError(null);
    setPhase("review");
  }

  function reset() {
    setContact({ ...emptyContact(), event: eventName, repName, repId });
    setCapturedImage(null);
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
        <>
          {repName && (
            <p className="text-base font-medium text-brand-dark">
              Welcome, {firstNameOf(repName)} 👋
            </p>
          )}
          <BadgeScanner
            onCapture={handleCapture}
            onManual={handleManual}
            busy={scanning}
          />
        </>
      )}

      {phase === "review" && (
        <>
          <button
            type="button"
            onClick={reset}
            className="-ml-1 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <span aria-hidden>←</span> Back
          </button>
          <p className="text-sm text-gray-500">
            Check the details are correct, then save. Anything you don&apos;t
            have — email, title, and more — gets enriched and filled in
            automatically.
          </p>
          {capturedImage && <BadgeProof image={capturedImage} />}
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
