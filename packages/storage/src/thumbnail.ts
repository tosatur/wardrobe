import sharp from "sharp";

export type Thumbnail = {
  buffer: Buffer;
  mime: string;
  extension: string;
};

const DEFAULT_WIDTH = 480;

export async function createThumbnail(
  input: Buffer,
  options: { width?: number } = {},
): Promise<Thumbnail> {
  const buffer = await sharp(input)
    .resize({ width: options.width ?? DEFAULT_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  return { buffer, mime: "image/webp", extension: "webp" };
}
