import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { DEFAULT_MAX_BYTES, InvalidImageError, validateAndStripImage } from "./image-pipeline.js";

async function makeJpeg(withExif = false): Promise<Buffer> {
  const image = sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 200, g: 50, b: 50 } },
  });

  if (withExif) {
    // sharp's exif-writing API only supports IFD0-IFD3, not a dedicated GPS
    // block, but our pipeline strips ALL metadata indiscriminately on
    // re-encode (it never special-cases GPS), so proving arbitrary EXIF
    // tags don't survive the round trip proves GPS tags wouldn't either.
    return image
      .withMetadata({ exif: { IFD0: { Make: "TestCam", GPSTag: "37.775,-122.419" } } })
      .jpeg()
      .toBuffer();
  }

  return image.jpeg().toBuffer();
}

function makePng(): Promise<Buffer> {
  return sharp({
    create: { width: 8, height: 8, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

describe("validateAndStripImage", () => {
  it("accepts a valid JPEG and returns the correct mime/extension", async () => {
    const jpeg = await makeJpeg();
    const result = await validateAndStripImage(jpeg);
    expect(result.mime).toBe("image/jpeg");
    expect(result.extension).toBe("jpg");
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });

  it("accepts a valid PNG", async () => {
    const png = await makePng();
    const result = await validateAndStripImage(png);
    expect(result.mime).toBe("image/png");
    expect(result.extension).toBe("png");
  });

  it("strips EXIF metadata (including any GPS-carrying tags) from the output", async () => {
    const jpegWithExif = await makeJpeg(true);

    const before = await sharp(jpegWithExif).metadata();
    expect(before.exif).toBeDefined();

    const result = await validateAndStripImage(jpegWithExif);
    const after = await sharp(result.buffer).metadata();

    expect(after.exif).toBeUndefined();
  });

  it("rejects a file whose magic bytes don't match a supported image type", async () => {
    const fakeImage = Buffer.from("this is definitely not an image, just text");
    await expect(validateAndStripImage(fakeImage)).rejects.toThrow(InvalidImageError);
  });

  it("rejects a file with a renamed extension but wrong content", async () => {
    // A .txt-style buffer masquerading as an upload named photo.jpg, the
    // pipeline only trusts magic bytes, never the filename/client MIME.
    const notAnImage = Buffer.from("<html>not an image</html>");
    await expect(validateAndStripImage(notAnImage)).rejects.toThrow(
      /not a supported image type/,
    );
  });

  it("rejects a buffer larger than the configured max size", async () => {
    const jpeg = await makeJpeg();
    await expect(validateAndStripImage(jpeg, { maxBytes: 10 })).rejects.toThrow(
      /exceeds the maximum/,
    );
  });

  it("uses a sane default max size", () => {
    expect(DEFAULT_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});
