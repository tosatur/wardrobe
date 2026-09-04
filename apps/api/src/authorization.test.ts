import { describe, expect, it } from "vitest";
import { canModify, canView } from "./authorization.js";

describe("canView", () => {
  it("owner can view their own private item", () => {
    expect(canView({ ownerId: "user-1", visibility: "private" }, "user-1")).toBe(true);
  });

  it("owner can view their own public item", () => {
    expect(canView({ ownerId: "user-1", visibility: "public" }, "user-1")).toBe(true);
  });

  it("non-owner cannot view a private item", () => {
    expect(canView({ ownerId: "user-1", visibility: "private" }, "user-2")).toBe(false);
  });

  it("non-owner can view a public item", () => {
    expect(canView({ ownerId: "user-1", visibility: "public" }, "user-2")).toBe(true);
  });
});

describe("canModify", () => {
  it("owner can modify their own item", () => {
    expect(canModify({ ownerId: "user-1" }, "user-1")).toBe(true);
  });

  it("non-owner cannot modify another user's item, even if public", () => {
    expect(canModify({ ownerId: "user-1" }, "user-2")).toBe(false);
  });
});
