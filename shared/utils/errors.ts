/**
 * Error handling utilities
 * Centralized error handling patterns and utilities
 */

import { toast } from "sonner";

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Extract error message from unknown error type
 * 
 * @param error - Unknown error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  
  return "An unexpected error occurred";
}

/**
 * Handle mutation error with toast notification
 * 
 * @param error - Error object
 * @param defaultMessage - Default message if error message cannot be extracted
 */
export function handleMutationError(error: unknown, defaultMessage: string = "Operation failed"): void {
  const message = getErrorMessage(error);
  toast.error(message || defaultMessage);
}

/**
 * Create a standardized error handler for React Query mutations
 * 
 * @param defaultMessage - Default error message
 * @returns Error handler function
 */
export function createErrorHandler(defaultMessage: string = "Operation failed") {
  return (error: unknown) => {
    handleMutationError(error, defaultMessage);
  };
}

/**
 * Create success handler for React Query mutations
 * 
 * @param message - Success message
 * @returns Success handler function
 */
export function createSuccessHandler(message: string) {
  return () => {
    toast.success(message);
  };
}
