import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StorageDriver } from "./types.js";

const KEY_PATTERN = /^[a-f0-9-]+\.[a-z0-9]+$/i;

export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly rootDir: string) {}

  async save(input: { buffer: Buffer; extension: string }): Promise<{ key: string }> {
    await mkdir(this.rootDir, { recursive: true });
    const key = `${randomUUID()}.${input.extension}`;
    await writeFile(this.resolveKey(key), input.buffer);
    return { key };
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  private resolveKey(key: string): string {
    if (!KEY_PATTERN.test(key)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return path.join(this.rootDir, key);
  }
}
