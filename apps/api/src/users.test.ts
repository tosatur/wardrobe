import { describe, expect, it, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import multipart from "@fastify/multipart";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@wardrobe/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@wardrobe/storage", () => ({
  LocalStorageDriver: class {
    save = vi.fn().mockResolvedValue({ key: "new-avatar-key.jpg" });
    read = vi.fn().mockResolvedValue(Buffer.from("fake-bytes"));
    delete = vi.fn();
  },
  validateAndStripImage: vi.fn().mockResolvedValue({
    buffer: Buffer.from("fake"),
    mime: "image/jpeg",
    extension: "jpg",
  }),
  InvalidImageError: class InvalidImageError extends Error {},
}));

vi.mock("./authorization.js", () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: "user-1", role: "member" } }),
}));

function multipartBody(boundary: string) {
  return Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="avatar.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ),
    Buffer.from("fake-image-bytes"),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
}

describe("POST /users/me/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the avatar and sets the user's image to the stable photo URL", async () => {
    const { userRoutes } = await import("./users.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({ avatarKey: null } as never);
    vi.mocked(prismaMock.user.update).mockResolvedValue({} as never);

    const app = Fastify();
    await app.register(multipart);
    await app.register(userRoutes);

    const boundary = "----testboundary";
    const response = await app.inject({
      method: "POST",
      url: "/users/me/photo",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: multipartBody(boundary),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ image: "/users/user-1/photo" });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { avatarKey: "new-avatar-key.jpg", avatarMime: "image/jpeg", image: "/users/user-1/photo" },
    });
    await app.close();
  });

  it("returns 400 when no file is uploaded", async () => {
    const { userRoutes } = await import("./users.js");

    const app = Fastify();
    await app.register(multipart);
    await app.register(userRoutes);

    const response = await app.inject({
      method: "POST",
      url: "/users/me/photo",
      headers: { "content-type": "multipart/form-data; boundary=----empty" },
      payload: Buffer.from("------empty--\r\n"),
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe("GET /users/:id/photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves the stored avatar bytes with the stored mime type", async () => {
    const { userRoutes } = await import("./users.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      avatarKey: "some-key.jpg",
      avatarMime: "image/jpeg",
    } as never);

    const app = Fastify();
    await app.register(userRoutes);

    const response = await app.inject({ method: "GET", url: "/users/user-1/photo" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/jpeg");
    await app.close();
  });

  it("returns 404 when the user has no avatar", async () => {
    const { userRoutes } = await import("./users.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({ avatarKey: null } as never);

    const app = Fastify();
    await app.register(userRoutes);

    const response = await app.inject({ method: "GET", url: "/users/user-1/photo" });

    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("returns 404 for another user's photo", async () => {
    const { userRoutes } = await import("./users.js");

    const app = Fastify();
    await app.register(userRoutes);

    const response = await app.inject({ method: "GET", url: "/users/user-2/photo" });

    expect(response.statusCode).toBe(404);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it("lets an admin view another user's photo", async () => {
    const { requireSession } = await import("./authorization.js");
    vi.mocked(requireSession).mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    } as never);

    const { userRoutes } = await import("./users.js");

    vi.mocked(prismaMock.user.findUnique).mockResolvedValue({
      avatarKey: "some-key.jpg",
      avatarMime: "image/jpeg",
    } as never);

    const app = Fastify();
    await app.register(userRoutes);

    const response = await app.inject({ method: "GET", url: "/users/user-2/photo" });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
