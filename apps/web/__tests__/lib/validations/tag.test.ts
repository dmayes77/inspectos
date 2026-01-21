import { describe, expect, it } from "vitest";
import { createTagSchema, updateTagSchema } from "@/lib/validations/tag";

describe("createTagSchema", () => {
  it("should validate a valid tag", () => {
    const validTag = {
      name: "Important",
      scope: "job",
      tagType: "custom",
      description: "Marks important items",
      color: "#FF5733",
    };

    const result = createTagSchema.safeParse(validTag);
    expect(result.success).toBe(true);
  });

  it("should require a name", () => {
    const invalidTag = {
      scope: "job",
    };

    const result = createTagSchema.safeParse(invalidTag);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((e) => e.path.includes("name"))).toBe(true);
    }
  });

  it("should require a valid scope", () => {
    const invalidTag = {
      name: "Test Tag",
      scope: "invalid_scope",
    };

    const result = createTagSchema.safeParse(invalidTag);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((e) => e.path.includes("scope"))).toBe(true);
    }
  });

  it("should accept all valid scopes", () => {
    const scopes = ["job", "inspection", "client", "lead", "invoice", "payment", "service", "template"];

    scopes.forEach((scope) => {
      const tag = { name: "Test", scope };
      const result = createTagSchema.safeParse(tag);
      expect(result.success).toBe(true);
    });
  });

  it("should validate hex color format", () => {
    const validColors = ["#FF5733", "#fff", "#ABC123", "#000"];
    const invalidColors = ["red", "FF5733", "#GGG", "#12345", "rgb(255,0,0)"];

    validColors.forEach((color) => {
      const tag = { name: "Test", scope: "job", color };
      const result = createTagSchema.safeParse(tag);
      expect(result.success).toBe(true);
    });

    invalidColors.forEach((color) => {
      const tag = { name: "Test", scope: "job", color };
      const result = createTagSchema.safeParse(tag);
      expect(result.success).toBe(false);
    });
  });

  it("should allow null color", () => {
    const tag = {
      name: "Test",
      scope: "job",
      color: null,
    };

    const result = createTagSchema.safeParse(tag);
    expect(result.success).toBe(true);
  });

  it("should default tagType to custom", () => {
    const tag = {
      name: "Test",
      scope: "job",
    };

    const result = createTagSchema.safeParse(tag);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagType).toBe("custom");
    }
  });

  it("should accept all valid tag types", () => {
    const tagTypes = ["stage", "status", "segment", "source", "priority", "custom"];

    tagTypes.forEach((tagType) => {
      const tag = { name: "Test", scope: "job", tagType };
      const result = createTagSchema.safeParse(tag);
      expect(result.success).toBe(true);
    });
  });

  it("should reject a name that is too long", () => {
    const tag = {
      name: "a".repeat(101),
      scope: "job",
    };

    const result = createTagSchema.safeParse(tag);
    expect(result.success).toBe(false);
  });
});

describe("updateTagSchema", () => {
  it("should allow partial updates", () => {
    const partialUpdate = {
      name: "Updated Name",
    };

    const result = updateTagSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it("should allow an empty update", () => {
    const emptyUpdate = {};

    const result = updateTagSchema.safeParse(emptyUpdate);
    expect(result.success).toBe(true);
  });

  it("should still validate field formats", () => {
    const invalidUpdate = {
      color: "not-a-color",
    };

    const result = updateTagSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});
