import { NextRequest, NextResponse } from "next/server";
import { extractContactFromImage } from "@/lib/ocr";

export const runtime = "nodejs";
// Never cache OCR responses — every request is a distinct badge.
export const dynamic = "force-dynamic";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * POST /api/ocr
 * Body: { image: "data:image/jpeg;base64,...." }
 * Returns: OcrResult
 *
 * The image is processed in-memory and discarded — nothing is persisted.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dataUrl: unknown = body?.image;

    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return NextResponse.json(
        { error: "Expected an `image` data URL." },
        { status: 400 },
      );
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Malformed image data URL." },
        { status: 400 },
      );
    }

    const mediaType = match[1];
    const base64Data = match[2];

    if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${mediaType}` },
        { status: 400 },
      );
    }

    const result = await extractContactFromImage(
      base64Data,
      mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
