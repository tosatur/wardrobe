import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

export const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
export const MAX_DIMENSION = 8000;

type SharpFormat = "jpeg" | "png" | "webp";

const ALLOWED = new Map<string, { extension: string; sharpFormat: SharpFormat }>([
  ["image/jpeg", { extension: "jpg", sharpFormat: "jpeg" }],
  ["image/png", { extension: "png", sharpFormat: "png" }],
  ["image/webp", { extension: "webp", sharpFormat: "webp" }],
]);

export class InvalidImageError extends Error {}

export type ProcessedImage = {
  buffer: Buffer;
  mime: string;
  extension: string;
};

/**
 * Validates an uploaded image by its actual magic bytes (not client-declared
 * MIME type or filename), then re-encodes it through sharp. The re-encode
 * both confirms the file really decodes as an image (defense-in-depth
 * against decompression bombs / malformed files that pass the magic-byte
 * check) and strips all metadata, including EXIF GPS tags, as a side effect
 * of sharp not preserving metadata on output unless `.withMetadata()` is
 * called. `.rotate()` bakes in the EXIF orientation visually before that
 * metadata is dropped, so re-encoded images don't come out sideways.
 */
export async function validateAndStripImage(
  input: Buffer,
  options: { maxBytes?: number } = {},
): Promise<ProcessedImage> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (input.byteLength > maxBytes) {
    throw new InvalidImageError("File exceeds the maximum allowed size.");
  }

  const detected = await fileTypeFromBuffer(input);
  if (!detected) {
    throw new InvalidImageError("File is not a supported image type (JPEG, PNG, WebP only).");
  }
  const match = ALLOWED.get(detected.mime);
  if (!match) {
    throw new InvalidImageError("File is not a supported image type (JPEG, PNG, WebP only).");
  }

  let buffer: Buffer;
  try {
    buffer = await sharp(input, { limitInputPixels: MAX_DIMENSION * MAX_DIMENSION })
      .rotate()
      .toFormat(match.sharpFormat)
      .toBuffer();
  } catch {
    throw new InvalidImageError("File could not be decoded as a valid image.");
  }

  return { buffer, mime: detected.mime, extension: match.extension };
}
