import { describe, expect, it } from "vitest";
import { createTemplateStubSchema, updateTemplateSchema } from "@/lib/validations/template";

describe("createTemplateStubSchema", () => {
  it("should validate a valid stub request", () => {
    const result = createTemplateStubSchema.safeParse({
      action: "create_stub",
      name: "Inspection Template",
      description: "Auto-created stub",
    });
    expect(result.success).toBe(true);
  });

  it("should allow missing action", () => {
    const result = createTemplateStubSchema.safeParse({ name: "Default Stub" });
    expect(result.success).toBe(true);
  });

  it("should reject unsupported actions", () => {
    const result = createTemplateStubSchema.safeParse({ action: "duplicate" });
    expect(result.success).toBe(false);
  });

  it("should reject a name that is too long", () => {
    const result = createTemplateStubSchema.safeParse({ name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe("updateTemplateSchema", () => {
  it("should validate a template update with sections and items", () => {
    const result = updateTemplateSchema.safeParse({
      name: "Updated Template",
      type: "inspection",
      sections: [
        {
          name: "Structure",
          items: [
            {
              name: "Foundation",
              itemType: "text",
              isRequired: true,
            },
          ],
        },
      ],
      serviceIds: ["service-1"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid item type", () => {
    const result = updateTemplateSchema.safeParse({
      sections: [
        {
          name: "Structure",
          items: [{ name: "Foundation", itemType: "invalid" }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty section names", () => {
    const result = updateTemplateSchema.safeParse({
      sections: [{ name: "", items: [] }],
    });
    expect(result.success).toBe(false);
  });
});
