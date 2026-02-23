import { describe, expect, it, vi } from "vitest";
import { validateRequestBody } from "@/lib/api/validate";
import { z } from "zod";

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0, "Age must be positive"),
});

function createMockRequest(body: unknown): Request {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Request;
}

function createMockRequestWithError(): Request {
  return {
    json: vi.fn().mockRejectedValue(new SyntaxError("Invalid JSON")),
  } as unknown as Request;
}

describe("validateRequestBody", () => {
  it("should return data for valid input", async () => {
    const request = createMockRequest({ name: "John", age: 30 });

    const result = await validateRequestBody(request, testSchema);

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ name: "John", age: 30 });
  });

  it("should return error for invalid input", async () => {
    const request = createMockRequest({ name: "", age: -1 });

    const result = await validateRequestBody(request, testSchema);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();

    const response = result.error!;
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeInstanceOf(Array);
    expect(body.details.length).toBeGreaterThan(0);
  });

  it("should return error for missing required fields", async () => {
    const request = createMockRequest({ age: 30 });

    const result = await validateRequestBody(request, testSchema);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();

    const response = result.error!;
    const body = await response.json();
    expect(body.details.some((d: { field: string }) => d.field === "name")).toBe(true);
  });

  it("should return error for invalid JSON", async () => {
    const request = createMockRequestWithError();

    const result = await validateRequestBody(request, testSchema);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();

    const response = result.error!;
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("should include field paths in error details", async () => {
    const nestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });

    const request = createMockRequest({ user: { email: "invalid" } });

    const result = await validateRequestBody(request, nestedSchema);

    expect(result.error).toBeDefined();
    const body = await result.error!.json();
    expect(body.details[0].field).toBe("user.email");
  });
});
