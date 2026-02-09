import "@testing-library/jest-dom/vitest";
import { vi, expect, beforeEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Enable React 19 act environment
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Mock React Suspense to render children immediately in tests
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode; fallback?: React.ReactNode }) => children,
  };
});

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js Link component - use createElement to avoid JSX in .ts file
vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) =>
      React.createElement("a", { href }, children),
  };
});

// Mock TenantProvider and useApiClient
vi.mock("@/lib/api/tenant-context", async () => {
  const React = await import("react");
  return {
    TenantProvider: ({ children }: { children: React.ReactNode }) => children,
    useTenant: () => ({ tenantSlug: "test-tenant" }),
    useApiClient: () => ({
      get: vi.fn(() => Promise.resolve([])),
      post: vi.fn(() => Promise.resolve({})),
      put: vi.fn(() => Promise.resolve({})),
      delete: vi.fn(() => Promise.resolve({})),
    }),
  };
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
