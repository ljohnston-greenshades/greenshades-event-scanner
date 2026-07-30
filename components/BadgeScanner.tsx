"use client";

import { useRef, useState } from "react";
import { ScanningOverlay } from "@/components/ScanningOverlay";

/**
 * The capture screen. Three ways in:
 *  - "Scan a badge" (primary): opens the rear camera to photograph a badge.
 *  - "Upload a photo": picks an existing image from the camera roll / files.
 *  - "Enter manually": skips OCR and goes straight to a blank review form.
 * The first two run OCR via onCapture; the last calls onManual.
 */
export function BadgeScanner({
  onCapture,
  onManual,
  busy,
}: {
  onCapture: (dataUrl: string) => void;
  onManual: () => void;
  busy: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onCapture(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Rear camera on phones */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onInputChange}
      />
      {/* Camera roll / photo library (no `capture` attribute) */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Captured badge"
            className="w-full rounded-lg border border-gray-200"
          />
          {busy && <ScanningOverlay />}
        </div>
      ) : (
        <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 px-4 text-center text-gray-400">
          <span className="text-2xl" aria-hidden>
            ⤢
          </span>
          <span className="text-sm">
            Point your camera at a badge and tap{" "}
            <span className="font-medium text-gray-500">Scan a badge</span>.
          </span>
        </div>
      )}

      {/* Primary call to action */}
      <button
        type="button"
        disabled={busy}
        onClick={() => cameraRef.current?.click()}
        className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Reading badge…" : "Scan a badge"}
      </button>

      {/* Secondary options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => uploadRef.current?.click()}
          className="rounded-lg border border-brand px-3 py-3 font-semibold text-brand disabled:opacity-50"
        >
          Upload a photo
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onManual}
          className="rounded-lg border border-gray-300 px-3 py-3 font-semibold text-gray-700 disabled:opacity-50"
        >
          Enter manually
        </button>
      </div>
    </div>
  );
}
