"use client";

import { useState } from "react";

/**
 * Compact proofing strip on the review step: a small badge thumbnail (tap to
 * maximize in a lightbox so the rep can re-check the OCR) plus a small "Save"
 * button. Kept compact so the form fields stay above the fold.
 *
 * Save uses the Web Share sheet on mobile ("Save Image" → Photos) and falls
 * back to a download elsewhere — browsers can't write to the camera roll
 * automatically.
 */
export function BadgeProof({ image }: { image: string }) {
  const [open, setOpen] = useState(false);

  async function save() {
    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], `badge-${Date.now()}.jpg`, {
        type: blob.type || "image/jpeg",
      });
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: "Badge photo" });
        } catch {
          /* dismissed */
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* best-effort */
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge badge photo"
          className="relative shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Scanned badge"
            className="h-12 w-16 rounded object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center rounded bg-black/20 text-sm text-white">
            ⤢
          </span>
        </button>
        <span className="text-xs text-gray-500">
          Scanned badge — tap to enlarge and check
        </span>
        <button
          type="button"
          onClick={save}
          className="ml-auto shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600"
        >
          Save
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Scanned badge, enlarged"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-800"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
