import { describe, expect, it } from "vitest";
import { createClientSchema, updateClientSchema } from "@inspectos/shared/validations/client";

describe("createClientSchema", () => {
  it("should validate a valid client", () => {
    const validClient = {
      name: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      type: "Homebuyer",
      company: "Acme Inc",
      notes: "Test notes",
    };

    const result = createClientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });

  it("should require a name", () => {
    const invalidClient = {
      email: "john@example.com",
    };

    const result = createClientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("should reject an invalid email", () => {
    const invalidClient = {
      name: "John Doe",
      email: "not-an-email",
    };

    const result = createClientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("should reject an invalid phone format", () => {
    const invalidClient = {
      name: "John Doe",
      phone: "abc-invalid-phone!",
    };

    const result = createClientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("phone");
    }
  });

  it("should reject an invalid client type", () => {
    const invalidClient = {
      name: "John Doe",
      type: "InvalidType",
    };

    const result = createClientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
  });

  it("should accept null values for optional fields", () => {
    const client = {
      name: "John Doe",
      email: null,
      phone: null,
      type: null,
      company: null,
      notes: null,
    };

    const result = createClientSchema.safeParse(client);
    expect(result.success).toBe(true);
  });
});

describe("updateClientSchema", () => {
  it("should allow partial updates", () => {
    const partialUpdate = {
      name: "Jane Doe",
    };

    const result = updateClientSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it("should allow an empty update", () => {
    const emptyUpdate = {};

    const result = updateClientSchema.safeParse(emptyUpdate);
    expect(result.success).toBe(true);
  });

  it("should still validate field formats", () => {
    const invalidUpdate = {
      email: "not-an-email",
    };

    const result = updateClientSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});
