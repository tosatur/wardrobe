import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, storageMock, removeBackgroundMock, createThumbnailMock, cropToContentMock } =
  vi.hoisted(() => ({
    prismaMock: {
      item: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
    storageMock: {
      read: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    },
    removeBackgroundMock: vi.fn(),
    createThumbnailMock: vi.fn(),
    cropToContentMock: vi.fn(),
  }));

vi.mock("@wardrobe/db", () => ({ prisma: prismaMock }));
vi.mock("./storage.js", () => ({ storage: storageMock }));
vi.mock("@imgly/background-removal-node", () => ({ removeBackground: removeBackgroundMock }));
vi.mock("@wardrobe/storage", () => ({
  createThumbnail: createThumbnailMock,
  cropToContent: cropToContentMock,
}));

const { processPhotoJob } = await import("./process-photo.js");

const JOB = { itemId: "item-1", photoOriginalKey: "orig.jpg" };

function makeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: "item-1", photoOriginalKey: "orig.jpg", ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  storageMock.read.mockResolvedValue(Buffer.from("original"));
  storageMock.save
    .mockResolvedValueOnce({ key: "cutout.png" })
    .mockResolvedValueOnce({ key: "thumb.webp" });
  removeBackgroundMock.mockResolvedValue({
    // Buffer.from(string).buffer can point at Node's shared, larger memory
    // pool rather than an exactly-sized ArrayBuffer; a real Blob's
    // arrayBuffer() always returns one sized to its exact content, so mirror
    // that here via a copying Uint8Array rather than reusing the pool.
    arrayBuffer: () => Promise.resolve(new Uint8Array(Buffer.from("cutout")).buffer),
  });
  cropToContentMock.mockResolvedValue(Buffer.from("cropped"));
  createThumbnailMock.mockResolvedValue({
    buffer: Buffer.from("thumb"),
    mime: "image/webp",
    extension: "webp",
  });
});

describe("processPhotoJob", () => {
  it("is a no-op when the item no longer exists", async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);

    await processPhotoJob(JOB);

    expect(storageMock.read).not.toHaveBeenCalled();
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("is a no-op when the original was already replaced before the job started", async () => {
    prismaMock.item.findUnique.mockResolvedValue(makeItem({ photoOriginalKey: "newer.jpg" }));

    await processPhotoJob(JOB);

    expect(storageMock.read).not.toHaveBeenCalled();
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("on the happy path, saves the cutout and thumbnail and marks the item ready", async () => {
    prismaMock.item.findUnique.mockResolvedValue(makeItem());

    await processPhotoJob(JOB);

    const [blobArg, optionsArg] = removeBackgroundMock.mock.calls[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe("image/jpeg");
    expect(Buffer.from(await blobArg.arrayBuffer())).toEqual(Buffer.from("original"));
    expect(optionsArg).toEqual({ output: { format: "image/png" } });
    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { photoCutoutKey: "cutout.png", photoThumbnailKey: "thumb.webp", photoStatus: "ready" },
    });
  });

  it("crops the cutout to content before thumbnailing and saving", async () => {
    prismaMock.item.findUnique.mockResolvedValue(makeItem());

    await processPhotoJob(JOB);

    expect(cropToContentMock).toHaveBeenCalledWith(Buffer.from("cutout"));
    expect(createThumbnailMock).toHaveBeenCalledWith(Buffer.from("cropped"));
    expect(storageMock.save).toHaveBeenNthCalledWith(1, {
      buffer: Buffer.from("cropped"),
      extension: "png",
    });
  });

  it("discards results and skips the DB write when the original was replaced mid-job", async () => {
    prismaMock.item.findUnique
      .mockResolvedValueOnce(makeItem())
      .mockResolvedValueOnce(makeItem({ photoOriginalKey: "newer.jpg" }));

    await processPhotoJob(JOB);

    expect(storageMock.delete).toHaveBeenCalledWith("cutout.png");
    expect(storageMock.delete).toHaveBeenCalledWith("thumb.webp");
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("marks the item failed when background removal throws", async () => {
    prismaMock.item.findUnique.mockResolvedValue(makeItem());
    removeBackgroundMock.mockRejectedValue(new Error("model exploded"));

    await processPhotoJob(JOB);

    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { photoStatus: "failed" },
    });
  });

  it("does not overwrite a newer upload's status when a stale job fails", async () => {
    prismaMock.item.findUnique
      .mockResolvedValueOnce(makeItem())
      .mockResolvedValueOnce(makeItem({ photoOriginalKey: "newer.jpg" }));
    removeBackgroundMock.mockRejectedValue(new Error("model exploded"));

    await processPhotoJob(JOB);

    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });
});
