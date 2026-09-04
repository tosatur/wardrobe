export interface StorageDriver {
  save(input: { buffer: Buffer; extension: string }): Promise<{ key: string }>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
