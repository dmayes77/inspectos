/**
 * Server-side environment variable validation
 * Import this in server components or API routes to validate env vars
 * 
 * Usage:
 * import "@/lib/env.server";
 */

import { env } from "./env";

// Export validated env for use in server components
export { env };

// The validation happens on import, so just importing this file validates env vars
// This is safe because it only runs on the server (not bundled for client)
