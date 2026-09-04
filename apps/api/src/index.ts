import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "@wardrobe/db";
import { auth } from "./auth.js";
import { requireSession } from "./authorization.js";
import { itemRoutes } from "./items.js";
import { outfitRoutes } from "./outfits.js";
import { wearRoutes } from "./wears.js";
import { geocodeRoutes } from "./geocode.js";
import { weatherRoutes } from "./weather.js";
import { userRoutes } from "./users.js";

const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: webUrl,
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
});

await app.register(multipart, {
  limits: { fileSize: maxUploadBytes },
});

await app.register(itemRoutes);
await app.register(outfitRoutes);
await app.register(wearRoutes);
await app.register(geocodeRoutes);
await app.register(weatherRoutes);
await app.register(userRoutes);

app.get("/health", async () => {
  const userCount = await prisma.user.count();
  return { status: "ok", dbConnected: true, userCount };
});

// Only the very first user may self-register (and becomes admin); after
// that, registration is closed and admins create accounts via /admin/users.
// Better Auth's own sign-up endpoint is blocked so it can't be used to
// bypass this.
app.all("/api/auth/sign-up/email", async (_request, reply) => {
  return reply.status(404).send({ error: "Use /auth/register instead." });
});

app.post<{
  Body: { email?: string; password?: string; name?: string };
}>("/auth/register", async (request, reply) => {
  const { email, password, name } = request.body ?? {};

  if (!email || !password || !name) {
    return reply.status(400).send({ error: "email, password, and name are required." });
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return reply.status(403).send({ error: "Registration is closed. Ask an admin for an account." });
  }

  try {
    const { headers, response } = await auth.api.signUpEmail({
      returnHeaders: true,
      body: { email, password, name },
    });

    await prisma.user.update({ where: { id: response.user.id }, data: { role: "admin" } });

    for (const cookie of headers.getSetCookie()) {
      reply.header("set-cookie", cookie);
    }
    return reply.send(response);
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ error: "Registration failed." });
  }
});

app.post<{
  Body: { email?: string; password?: string; name?: string };
}>("/admin/users", async (request, reply) => {
  const session = await requireSession(request, reply);
  if (!session) return;
  if (session.user.role !== "admin") {
    return reply.status(403).send({ error: "Admin access required." });
  }

  const { email, password, name } = request.body ?? {};
  if (!email || !password || !name) {
    return reply.status(400).send({ error: "email, password, and name are required." });
  }

  try {
    const created = await auth.api.createUser({
      headers: fromNodeHeaders(request.headers),
      body: { email, password, name },
    });
    return reply.send({ user: created.user });
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ error: "User creation failed." });
  }
});

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const headers = fromNodeHeaders(request.headers);

    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });

    const response = await auth.handler(req);
    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    return reply.send(response.body ? await response.text() : null);
  },
});

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: "0.0.0.0" });
