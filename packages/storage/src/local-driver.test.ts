import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStorageDriver } from "./local-driver.js";

describe("LocalStorageDriver", () => {
  let dir: string;
  let driver: LocalStorageDriver;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "wardrobe-storage-"));
    driver = new LocalStorageDriver(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("round-trips a saved file", async () => {
    const buffer = Buffer.from("hello wardrobe");
    const { key } = await driver.save({ buffer, extension: "jpg" });

    expect(key).toMatch(/^[0-9a-f-]+\.jpg$/i);

    const read = await driver.read(key);
    expect(read.equals(buffer)).toBe(true);

    await driver.delete(key);
    await expect(driver.read(key)).rejects.toThrow();
  });

  it("generates unique keys for repeated saves", async () => {
    const buffer = Buffer.from("same content");
    const first = await driver.save({ buffer, extension: "png" });
    const second = await driver.save({ buffer, extension: "png" });

    expect(first.key).not.toBe(second.key);
  });

  it("rejects a key that isn't in the expected format", async () => {
    await expect(driver.read("../../etc/passwd")).rejects.toThrow(/Invalid storage key/);
    await expect(driver.delete("nested/path.jpg")).rejects.toThrow(/Invalid storage key/);
  });

  it("delete is a no-op for a missing key", async () => {
    await expect(driver.delete("00000000-0000-0000-0000-000000000000.jpg")).resolves.not.toThrow();
  });
});
