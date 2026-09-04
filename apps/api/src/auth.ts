import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@wardrobe/db";
import { hashPassword, verifyPassword } from "./password.js";

const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [webUrl],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      // No outbound email is configured on this instance, and registration
      // never sets emailVerified: true (there's no verification flow at
      // all) — so every account is permanently in the "unverified" state
      // change-email's own unverified-update escape hatch is built for.
      // Without this, POST /api/auth/change-email throws
      // CHANGE_EMAIL_DISABLED.
      updateEmailWithoutVerification: true,
    },
    additionalFields: {
      locationName: { type: "string", required: false },
      locationLat: { type: "number", required: false },
      locationLon: { type: "number", required: false },
      defaultCurrency: { type: "string", required: false, defaultValue: "USD" },
    },
  },
  plugins: [admin({ defaultRole: "member" })],
});
