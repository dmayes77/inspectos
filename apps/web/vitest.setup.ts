import "@testing-library/jest-dom/vitest";
import { vi, expect } from "vitest";
import * as React from "react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Enable React 19 act environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
