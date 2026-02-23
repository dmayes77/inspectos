import { ApiClient, ApiError, type ApiClientConfig } from "@inspectos/shared/api";

export { ApiClient, ApiError, type ApiClientConfig };

export function createApiClient(config: Partial<ApiClientConfig> = {}): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  return new ApiClient({
    baseUrl,
    credentials: "include",
    ...config,
  });
}
