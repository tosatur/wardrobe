import sharp from "sharp";

export const MIN_ASPECT_RATIO = 0.5; // 1:2 (tall)
export const MAX_ASPECT_RATIO = 2.0; // 2:1 (wide)

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Trims a transparent-background cutout down to the bounding box of its
 * actual (non-transparent) content, then, if that box's aspect ratio falls
 * outside [MIN_ASPECT_RATIO, MAX_ASPECT_RATIO], pads the short axis back out
 * with transparent pixels until it's back in range. Never crops into the
 * content itself to force it into range.
 */
export async function cropToContent(input: Buffer): Promise<Buffer> {
  let trimmedData: Buffer;
  let width: number;
  let height: number;

  try {
    const { data, info } = await sharp(input)
      .trim({ background: TRANSPARENT })
      .toBuffer({ resolveWithObject: true });
    trimmedData = data;
    width = info.width;
    height = info.height;
  } catch {
    // Pathologically small input (sharp requires at least 3x3 to trim) —
    // pass it through untouched rather than failing the photo job.
    return input;
  }

  const ratio = width / height;
  if (ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO) {
    return trimmedData;
  }

  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  if (ratio < MIN_ASPECT_RATIO) {
    const targetWidth = Math.ceil(height * MIN_ASPECT_RATIO);
    const pad = targetWidth - width;
    left = Math.floor(pad / 2);
    right = Math.ceil(pad / 2);
  } else {
    const targetHeight = Math.ceil(width / MAX_ASPECT_RATIO);
    const pad = targetHeight - height;
    top = Math.floor(pad / 2);
    bottom = Math.ceil(pad / 2);
  }

  return sharp(trimmedData)
    .extend({ top, bottom, left, right, background: TRANSPARENT })
    .png()
    .toBuffer();
}
