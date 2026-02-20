import { describe, expect, it } from "vitest";
import { assertNoProdAuthBypass } from "@/lib/security/env-guard";
import { enforceAuthBackoff, getAuthBackoffKey, recordAuthFailure, recordAuthSuccess } from "@/lib/security/auth-backoff";

describe("production bypass guard", () => {
  it("throws when BYPASS_AUTH is enabled in production", () => {
    const env = process.env as Record<string, string | undefined>;
    const originalNodeEnv = env.NODE_ENV;
    const originalBypass = env.BYPASS_AUTH;

    env.NODE_ENV = "production";
    env.BYPASS_AUTH = "true";

    expect(() => assertNoProdAuthBypass()).toThrow(/forbidden in production/i);

    env.NODE_ENV = originalNodeEnv;
    env.BYPASS_AUTH = originalBypass;
  });

  it("does not throw in production when bypass flags are disabled", () => {
    const env = process.env as Record<string, string | undefined>;
    const originalNodeEnv = env.NODE_ENV;
    const originalBypass = env.BYPASS_AUTH;

    env.NODE_ENV = "production";
    env.BYPASS_AUTH = "false";

    expect(() => assertNoProdAuthBypass()).not.toThrow();

    env.NODE_ENV = originalNodeEnv;
    env.BYPASS_AUTH = originalBypass;
  });
});

describe("auth backoff", () => {
  it("blocks repeated failures and clears after success", () => {
    const key = getAuthBackoffKey("127.0.0.1", "user@example.com");
    recordAuthFailure(key);
    recordAuthFailure(key);

    const blocked = enforceAuthBackoff(key);
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(429);

    recordAuthSuccess(key);
    const afterSuccess = enforceAuthBackoff(key);
    expect(afterSuccess).toBeNull();
  });
});
