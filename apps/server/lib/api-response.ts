/**
 * Standardized API response utilities
 * Consistent response format across all API endpoints
 */

import { logger } from "./logger";

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    count?: number;
    page?: number;
    totalPages?: number;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Common error codes
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  TENANT_MISMATCH: "TENANT_MISMATCH",
  SYNC_ERROR: "SYNC_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

interface ErrorOptions {
  code?: ErrorCode;
  details?: unknown;
  requestId?: string;
  logContext?: Record<string, unknown>;
}

/**
 * Create a success response
 */
export function success<T>(data: T, meta?: ApiSuccessResponse["meta"]): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    body.meta = meta;
  }
  return Response.json(body, { status: 200 });
}

/**
 * Create an error response with consistent format
 */
function createErrorResponse(status: number, message: string, options: ErrorOptions = {}): Response {
  const { code = ErrorCodes.INTERNAL_ERROR, details, requestId } = options;

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    body.error.details = details;
  }

  if (requestId) {
    body.requestId = requestId;
  }

  return Response.json(body, { status });
}

/**
 * 400 Bad Request
 */
export function badRequest(message: string, options?: Omit<ErrorOptions, "code">): Response {
  return createErrorResponse(400, message, { ...options, code: ErrorCodes.BAD_REQUEST });
}

/**
 * 401 Unauthorized
 */
export function unauthorized(message = "Authentication required", options?: Omit<ErrorOptions, "code">): Response {
  return createErrorResponse(401, message, { ...options, code: ErrorCodes.UNAUTHORIZED });
}

/**
 * 403 Forbidden
 */
export function forbidden(message = "Access denied", options?: Omit<ErrorOptions, "code">): Response {
  return createErrorResponse(403, message, { ...options, code: ErrorCodes.FORBIDDEN });
}

/**
 * 402 Payment Required
 */
export function paymentRequired(message = "Payment required", options?: Omit<ErrorOptions, "code">): Response {
  return createErrorResponse(402, message, { ...options, code: ErrorCodes.PAYMENT_REQUIRED });
}

/**
 * 404 Not Found
 */
export function notFound(message = "Resource not found", options?: Omit<ErrorOptions, "code">): Response {
  return createErrorResponse(404, message, { ...options, code: ErrorCodes.NOT_FOUND });
}

/**
 * 422 Validation Error
 */
export function validationError(message: string, details?: unknown, options?: Omit<ErrorOptions, "code" | "details">): Response {
  return createErrorResponse(422, message, { ...options, code: ErrorCodes.VALIDATION_ERROR, details });
}

/**
 * 429 Rate Limited
 */
export function rateLimited(message = "Too many requests", options?: Omit<ErrorOptions, "code">): Response {
  return createErrorResponse(429, message, { ...options, code: ErrorCodes.RATE_LIMITED });
}

/**
 * 500 Internal Server Error
 */
export function serverError(message = "An unexpected error occurred", error?: unknown, options?: Omit<ErrorOptions, "code">): Response {
  // Always log server errors
  logger.error(message, options?.logContext, error);

  // Don't expose internal error details in production
  const safeMessage = process.env.NODE_ENV === "production" ? "An unexpected error occurred" : message;

  return createErrorResponse(500, safeMessage, { ...options, code: ErrorCodes.INTERNAL_ERROR });
}
