import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { createThumbnail } from "./thumbnail.js";

function makePng(width = 1000, height = 800): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

describe("createThumbnail", () => {
  it("resizes to the default width and re-encodes as webp", async () => {
    const png = await makePng();
    const result = await createThumbnail(png);

    expect(result.mime).toBe("image/webp");
    expect(result.extension).toBe("webp");

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(480);
    expect(metadata.height).toBe(384);
  });

  it("respects a custom width option", async () => {
    const png = await makePng();
    const result = await createThumbnail(png, { width: 200 });

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBe(200);
  });

  it("does not upscale an image smaller than the target width", async () => {
    const png = await makePng(100, 80);
    const result = await createThumbnail(png);

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(80);
  });
});
