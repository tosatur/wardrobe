import type { FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) {
    reply.status(401).send({ error: "Authentication required." });
    return null;
  }
  return session;
}

export function canView(
  item: { ownerId: string; visibility: "private" | "public" },
  userId: string,
): boolean {
  return item.ownerId === userId || item.visibility === "public";
}

export function canModify(item: { ownerId: string }, userId: string): boolean {
  return item.ownerId === userId;
}
