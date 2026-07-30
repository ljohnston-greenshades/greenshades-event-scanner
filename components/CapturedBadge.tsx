"use client";

/**
 * Shows the captured badge image on the review step so the rep can check the
 * OCR against the photo, plus a "Save to camera roll" action.
 *
 * Note: browsers cannot silently write to the camera roll. On mobile this uses
 * the Web Share sheet (where "Save Image" saves to Photos); on desktop, or if
 * sharing files isn't supported, it falls back to a normal download.
 */
export function CapturedBadge({ image }: { image: string }) {
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
          // user dismissed the share sheet — nothing to do
        }
        return;
      }

      // Fallback: download the image.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // best-effort; saving the photo is optional
    }
  }

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="Captured badge — check the details below against it"
        className="max-h-56 w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
      />
      <button
        type="button"
        onClick={save}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
      >
        <span aria-hidden>⬇</span> Save photo to camera roll
      </button>
    </div>
  );
}
