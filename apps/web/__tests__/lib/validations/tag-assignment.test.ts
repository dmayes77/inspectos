import { describe, expect, it } from "vitest";
import {
  createTagAssignmentSchema,
  tagAssignmentDeleteSchema,
  tagAssignmentQuerySchema,
} from "@inspectos/shared/validations/tag-assignment";

describe("createTagAssignmentSchema", () => {
  it("should validate a valid tag assignment", () => {
    const result = createTagAssignmentSchema.safeParse({
      scope: "job",
      entityId: "entity-123",
      tagId: "tag-456",
    });
    expect(result.success).toBe(true);
  });

  it("should require a tagId", () => {
    const result = createTagAssignmentSchema.safeParse({
      scope: "job",
      entityId: "entity-123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject an invalid scope", () => {
    const result = createTagAssignmentSchema.safeParse({
      scope: "invalid",
      entityId: "entity-123",
      tagId: "tag-456",
    });
    expect(result.success).toBe(false);
  });

  it("should accept expanded scopes", () => {
    const scopes = ["invoice", "payment", "service", "template"];
    scopes.forEach((scope) => {
      const result = createTagAssignmentSchema.safeParse({
        scope,
        entityId: "entity-123",
        tagId: "tag-456",
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("tagAssignmentQuerySchema", () => {
  it("should validate a valid query", () => {
    const result = tagAssignmentQuerySchema.safeParse({
      scope: "inspection",
      entityId: "entity-123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing entityId", () => {
    const result = tagAssignmentQuerySchema.safeParse({
      scope: "inspection",
    });
    expect(result.success).toBe(false);
  });
});

describe("tagAssignmentDeleteSchema", () => {
  it("should validate delete query params", () => {
    const result = tagAssignmentDeleteSchema.safeParse({
      scope: "client",
      entityId: "entity-123",
      tagId: "tag-456",
    });
    expect(result.success).toBe(true);
  });

  it("should require tagId on delete", () => {
    const result = tagAssignmentDeleteSchema.safeParse({
      scope: "client",
      entityId: "entity-123",
    });
    expect(result.success).toBe(false);
  });
});
