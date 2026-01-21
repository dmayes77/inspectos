import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * Validates a request body against a Zod schema
 * Returns the parsed data if valid, or a NextResponse error if invalid
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      // Zod v4 uses 'issues' instead of 'errors'
      const errors = err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return {
        error: NextResponse.json(
          { error: "Validation failed", details: errors },
          { status: 400 }
        ),
      };
    }
    if (err instanceof SyntaxError) {
      return {
        error: NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json(
        { error: "Failed to parse request body" },
        { status: 400 }
      ),
    };
  }
}
