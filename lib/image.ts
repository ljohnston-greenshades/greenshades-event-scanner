// Client-side image normalization for uploads.
//
// Camera-roll photos on phones are large and sometimes in formats the OCR
// endpoint can't take (e.g. HEIC). Full-resolution JPEGs also blow past the
// serverless request-body limit once base64-encoded. So before uploading we
// decode the file, scale it down, and re-encode it as a compact JPEG.

const MAX_DIM = 1600; // longest side, px — plenty for badge OCR
const JPEG_QUALITY = 0.85;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          "Couldn't read that photo. iPhone HEIC photos can fail to open on a computer — try uploading it from your phone, or re-save it as a JPEG first.",
        ),
      );
    img.src = src;
  });
}

/**
 * Turn a picked/captured file into a compact JPEG data URL suitable for upload
 * and OCR: decode it, scale the longest side down to MAX_DIM, and re-encode as
 * JPEG. This keeps the request well under the serverless body limit and
 * normalizes odd camera formats (HEIC, etc.) to something the endpoint accepts.
 * Throws a friendly error if the browser can't decode the image at all.
 */
export async function prepareImageForUpload(file: File): Promise<string> {
  const original = await readAsDataURL(file);
  const img = await loadImage(original);

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original; // very old browser — send as-is and hope

  ctx.drawImage(img, 0, 0, width, height);

  const jpeg = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  // Guard: if the browser refused to encode (returns "data:,"), keep original.
  return jpeg.startsWith("data:image/jpeg") ? jpeg : original;
}
