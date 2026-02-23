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
      return new ApiError(response.status, "UNKNOWN_ERROR", response.statusText);
    }
  }
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

export interface ApiClientConfig {
  baseUrl: string;
  credentials?: RequestCredentials;
  defaultHeaders?: HeadersInit;
  retryConfig?: Partial<RetryConfig>;
}

const requestCache = new Map<string, Promise<unknown>>();

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export class ApiClient {
  private retryConfig: RetryConfig;
  private baseUrl: string;
  private credentials?: RequestCredentials;
  private defaultHeaders?: HeadersInit;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.credentials = config.credentials;
    this.defaultHeaders = config.defaultHeaders;
    this.retryConfig = { ...defaultRetryConfig, ...config.retryConfig };
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const method = options.method || "GET";
    const cacheKey = `${method}:${endpoint}`;

    if (method === "GET" && requestCache.has(cacheKey)) {
      return requestCache.get(cacheKey) as Promise<T>;
    }

    const requestPromise = this.executeRequest<T>(endpoint, options);

    if (method === "GET") {
      requestCache.set(cacheKey, requestPromise);
      requestPromise.finally(() => {
        requestCache.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        credentials: this.credentials ?? options.credentials,
        headers: {
          "Content-Type": "application/json",
          ...(this.defaultHeaders || {}),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const error = await ApiError.fromResponse(response);

        if (
          this.retryConfig.retryableStatuses.includes(response.status) &&
          retryCount < this.retryConfig.maxRetries
        ) {
          await this.delay(this.retryConfig.retryDelay * Math.pow(2, retryCount));
          return this.executeRequest<T>(endpoint, options, retryCount + 1);
        }

        throw error;
      }

      const result = await response.json();

      if (result.success === true && "data" in result) {
        return result.data;
      }

      return result;
    } catch (error) {
      if (error instanceof TypeError && retryCount < this.retryConfig.maxRetries) {
        await this.delay(this.retryConfig.retryDelay * Math.pow(2, retryCount));
        return this.executeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
