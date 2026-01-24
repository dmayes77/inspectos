import { describe, expect, it } from "vitest";
import {
  createInspectionSchema,
  updateInspectionSchema,
  updateInspectionStatusSchema,
} from "@/lib/validations/inspection-api";

describe("createInspectionSchema", () => {
    const validInspection = {
      address: "123 Main St, Austin, TX 78701",
      clientId: "client-123",
      inspectorId: "inspector-456",
      date: "2024-03-15",
      time: "09:00",
      types: ["service-1", "service-2"],
      propertyType: "single-family",
      yearBuilt: 2010,
      sqft: 2500,
      bedrooms: 4,
      bathrooms: 2.5,
      stories: "2",
      foundation: "slab",
      garage: "attached",
      pool: true,
      notes: "Front door code: 1234",
    };

  it("should validate a complete valid inspection", () => {
    const result = createInspectionSchema.safeParse(validInspection);
    expect(result.success).toBe(true);
  });

  it("should validate minimal required fields", () => {
    const minimal = {
      address: "123 Main St",
      clientId: "client-123",
      date: "2024-03-15",
      types: ["service-1"],
    };

    const result = createInspectionSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("should require address", () => {
    const { address: _, ...withoutAddress } = validInspection;

    const result = createInspectionSchema.safeParse(withoutAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((e) => e.path.includes("address"))).toBe(true);
    }
  });

  it("should require clientId", () => {
    const { clientId: _, ...withoutClient } = validInspection;

    const result = createInspectionSchema.safeParse(withoutClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((e) => e.path.includes("clientId"))).toBe(true);
    }
  });

  it("should require date in YYYY-MM-DD format", () => {
    const invalidDates = ["03-15-2024", "2024/03/15", "March 15, 2024", "15-03-2024"];

    invalidDates.forEach((date) => {
      const result = createInspectionSchema.safeParse({ ...validInspection, date });
      expect(result.success).toBe(false);
    });
  });

  it("should accept valid date format", () => {
    const result = createInspectionSchema.safeParse({ ...validInspection, date: "2024-12-31" });
    expect(result.success).toBe(true);
  });

  it("should require time in HH:MM format", () => {
    const invalidTimes = ["9:00", "9:00 AM", "09:00:00", "0900"];

    invalidTimes.forEach((time) => {
      const result = createInspectionSchema.safeParse({ ...validInspection, time });
      expect(result.success).toBe(false);
    });
  });

  it("should accept valid time format", () => {
    const validTimes = ["09:00", "14:30", "00:00", "23:59"];

    validTimes.forEach((time) => {
      const result = createInspectionSchema.safeParse({ ...validInspection, time });
      expect(result.success).toBe(true);
    });
  });

  it("should allow null time", () => {
    const result = createInspectionSchema.safeParse({ ...validInspection, time: null });
    expect(result.success).toBe(true);
  });

  it("should require at least one service type", () => {
    const result = createInspectionSchema.safeParse({ ...validInspection, types: [] });
    expect(result.success).toBe(false);
  });

  it("should validate yearBuilt range", () => {
    const tooOld = createInspectionSchema.safeParse({ ...validInspection, yearBuilt: 1799 });
    expect(tooOld.success).toBe(false);

    const future = createInspectionSchema.safeParse({
      ...validInspection,
      yearBuilt: new Date().getFullYear() + 1,
    });
    expect(future.success).toBe(false);

    const valid = createInspectionSchema.safeParse({ ...validInspection, yearBuilt: 1950 });
    expect(valid.success).toBe(true);
  });

  it("should require sqft to be positive", () => {
    const result = createInspectionSchema.safeParse({ ...validInspection, sqft: -100 });
    expect(result.success).toBe(false);

    const zero = createInspectionSchema.safeParse({ ...validInspection, sqft: 0 });
    expect(zero.success).toBe(false);
  });

  it("should reject notes that are too long", () => {
    const result = createInspectionSchema.safeParse({
      ...validInspection,
      notes: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateInspectionSchema", () => {
  it("should allow partial updates", () => {
    const result = updateInspectionSchema.safeParse({ address: "456 New St" });
    expect(result.success).toBe(true);
  });

  it("should allow empty update", () => {
    const result = updateInspectionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should still validate formats on partial updates", () => {
    const result = updateInspectionSchema.safeParse({ date: "invalid-date" });
    expect(result.success).toBe(false);
  });

  it("should allow status updates", () => {
    const result = updateInspectionSchema.safeParse({ status: "scheduled" });
    expect(result.success).toBe(true);
  });
});

describe("updateInspectionStatusSchema", () => {
  it("should validate a status update", () => {
    const result = updateInspectionStatusSchema.safeParse({
      status: "completed",
      notes: "All done",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status values", () => {
    const result = updateInspectionStatusSchema.safeParse({
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("should reject notes that are too long", () => {
    const result = updateInspectionStatusSchema.safeParse({
      notes: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
