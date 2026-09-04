import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { cropToContent, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from "./crop.js";

async function makeCutout(opts: {
  canvasWidth: number;
  canvasHeight: number;
  rectWidth: number;
  rectHeight: number;
  rectTop: number;
  rectLeft: number;
}): Promise<Buffer> {
  const rect = await sharp({
    create: {
      width: opts.rectWidth,
      height: opts.rectHeight,
      channels: 4,
      background: { r: 200, g: 50, b: 50, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: opts.canvasWidth,
      height: opts.canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: rect, top: opts.rectTop, left: opts.rectLeft }])
    .png()
    .toBuffer();
}

describe("cropToContent", () => {
  it("leaves an already in-ratio content box untouched aside from trimming", async () => {
    const cutout = await makeCutout({
      canvasWidth: 800,
      canvasHeight: 800,
      rectWidth: 300,
      rectHeight: 300,
      rectTop: 250,
      rectLeft: 250,
    });

    const result = await cropToContent(cutout);
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(300);
  });

  it("pads a too-tall content box wider to reach MIN_ASPECT_RATIO", async () => {
    const cutout = await makeCutout({
      canvasWidth: 800,
      canvasHeight: 800,
      rectWidth: 100,
      rectHeight: 400,
      rectTop: 200,
      rectLeft: 350,
    });

    const result = await cropToContent(cutout);
    const metadata = await sharp(result).metadata();

    expect(metadata.height).toBe(400);
    expect(metadata.width).toBe(Math.ceil(400 * MIN_ASPECT_RATIO));
  });

  it("pads a too-wide content box taller to reach MAX_ASPECT_RATIO", async () => {
    const cutout = await makeCutout({
      canvasWidth: 800,
      canvasHeight: 800,
      rectWidth: 400,
      rectHeight: 100,
      rectTop: 350,
      rectLeft: 200,
    });

    const result = await cropToContent(cutout);
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(Math.ceil(400 / MAX_ASPECT_RATIO));
  });

  it("splits an odd padding remainder without losing a pixel", async () => {
    const cutout = await makeCutout({
      canvasWidth: 800,
      canvasHeight: 800,
      rectWidth: 101,
      rectHeight: 400,
      rectTop: 200,
      rectLeft: 350,
    });

    const result = await cropToContent(cutout);
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBe(Math.ceil(400 * MIN_ASPECT_RATIO));
    expect(metadata.height).toBe(400);
  });

  it("still ratio-clamps a fully opaque image with nothing to trim", async () => {
    const cutout = await sharp({
      create: { width: 300, height: 100, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const result = await cropToContent(cutout);
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(Math.ceil(300 / MAX_ASPECT_RATIO));
  });

  it("passes through a degenerate sub-3x3 input without throwing", async () => {
    const tiny = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();

    await expect(cropToContent(tiny)).resolves.toBeInstanceOf(Buffer);
  });
});
