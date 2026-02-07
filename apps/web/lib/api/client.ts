import { supabase } from "@/lib/supabase/client";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    try {
      const body = await response.json();
      return new ApiError(
        response.status,
        body.error?.code || "UNKNOWN_ERROR",
        body.error?.message || response.statusText,
        body.error?.details
      );
    } catch {
      return new ApiError(
        response.status,
        "UNKNOWN_ERROR",
        response.statusText
      );
    }
  }
}

/**
 * Request deduplication cache
 */
const requestCache = new Map<string, Promise<unknown>>();

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Request timeout, rate limit, server errors
};

/**
 * Centralized API client with automatic authentication and tenant context
 */
export class ApiClient {
  private retryConfig: RetryConfig;

  constructor(
    private baseUrl: string,
    private getAccessToken: () => Promise<string | null>,
    private tenantSlug: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.retryConfig = { ...defaultRetryConfig, ...retryConfig };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Core request method with authentication, error handling, retry logic, and deduplication
   */
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const method = options.method || "GET";
    const cacheKey = `${method}:${endpoint}`;

    // Request deduplication for GET requests
    if (method === "GET" && requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options);

    // Cache GET requests to prevent duplicate calls
    if (method === "GET") {
      requestCache.set(cacheKey, requestPromise);

      // Clear cache after request completes (success or failure)
      requestPromise.finally(() => {
        requestCache.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const token = await this.getAccessToken();

    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "No access token available");
    }

    // Build URL with tenant query parameter
    const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(this.tenantSlug)}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await ApiError.fromResponse(response);

        // Retry on retryable status codes
        if (
          this.retryConfig.retryableStatuses.includes(response.status) &&
          retryCount < this.retryConfig.maxRetries
        ) {
          await this.delay(this.retryConfig.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
          return this.executeRequest<T>(endpoint, options, retryCount + 1);
        }

        throw error;
      }

      const result = await response.json();

      // Handle standardized API response format: { success: true, data: T }
      if (result.success === true && "data" in result) {
        return result.data;
      }

      // Fallback for responses that don't use standardized format yet
      return result;
    } catch (error) {
      // Retry on network errors
      if (
        error instanceof TypeError && // Network errors throw TypeError
        retryCount < this.retryConfig.maxRetries
      ) {
        await this.delay(this.retryConfig.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.executeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create an API client instance
 */
export function createApiClient(tenantSlug: string): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Failed to get session:", error);
      return null;
    }

    return session?.access_token ?? null;
  };

  return new ApiClient(baseUrl, getAccessToken, tenantSlug);
}
