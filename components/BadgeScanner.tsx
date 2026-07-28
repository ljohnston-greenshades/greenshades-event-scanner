"use client";

import { useRef, useState } from "react";

/**
 * Captures a badge photo. Uses a plain file input with `capture="environment"`
 * so it opens the rear camera on phones and a file picker on desktop — no
 * camera-stream permissions dance required for a first version.
 */
export function BadgeScanner({
  onCapture,
  busy,
}: {
  onCapture: (dataUrl: string) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Captured badge"
          className="w-full rounded-lg border border-gray-200"
        />
      ) : (
        <div className="flex aspect-[3/2] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400">
          No badge captured yet
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Reading badge…" : preview ? "Scan another" : "Scan a badge"}
      </button>
    </div>
  );
}
