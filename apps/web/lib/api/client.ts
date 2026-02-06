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
 * Centralized API client with automatic authentication and tenant context
 */
export class ApiClient {
  constructor(
    private baseUrl: string,
    private getAccessToken: () => Promise<string | null>,
    private tenantSlug: string
  ) {}

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
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Core request method with authentication and error handling
   */
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const token = await this.getAccessToken();

    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "No access token available");
    }

    // Build URL with tenant query parameter
    const url = `${this.baseUrl}${endpoint}?tenant=${encodeURIComponent(this.tenantSlug)}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    const result = await response.json();

    // Handle standardized API response format: { success: true, data: T }
    if (result.success === true && "data" in result) {
      return result.data;
    }

    // Fallback for responses that don't use standardized format yet
    return result;
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
