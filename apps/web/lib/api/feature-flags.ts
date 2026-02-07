/**
 * Feature flags for API migration
 *
 * Controls whether each entity should use the external central API
 * or the local Next.js API routes. This allows for gradual rollout
 * and easy rollback if issues arise.
 *
 * To enable external API for an entity, set the corresponding
 * environment variable to 'true' in .env.local:
 *
 * NEXT_PUBLIC_USE_EXTERNAL_API_LEADS=true
 */

export const USE_EXTERNAL_API = {
  // Phase 2: Pilot Migration
  leads: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_LEADS === "true",

  // Phase 3: Core Entities
  clients: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_CLIENTS === "true",
  services: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_SERVICES === "true",
  inspectors: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_INSPECTORS === "true",
  properties: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_PROPERTIES === "true",
  agencies: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_AGENCIES === "true",
  agents: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_AGENTS === "true",

  // Phase 4: Complex Entities
  orders: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ORDERS === "true",
  inspections: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_INSPECTIONS === "true",
  invoices: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_INVOICES === "true",
  schedule: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_SCHEDULE === "true",

  // Phase 5: Administrative
  team: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_TEAM === "true",
  tags: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_TAGS === "true",
  vendors: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_VENDORS === "true",
  emailTemplates: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_EMAIL_TEMPLATES === "true",
  tagAssignments: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_TAG_ASSIGNMENTS === "true",
  templates: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_TEMPLATES === "true",
  workflows: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_WORKFLOWS === "true",
  integrations: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_INTEGRATIONS === "true",
  webhooks: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_WEBHOOKS === "true",
  payments: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_PAYMENTS === "true",
  payouts: process.env.NEXT_PUBLIC_USE_EXTERNAL_API_PAYOUTS === "true",
} as const;

export type ApiEntity = keyof typeof USE_EXTERNAL_API;

/**
 * Check if a specific entity should use the external API
 */
export function shouldUseExternalApi(entity: ApiEntity): boolean {
  return USE_EXTERNAL_API[entity] ?? false;
}

/**
 * Get all entities that are currently using the external API
 */
export function getActiveExternalApiEntities(): ApiEntity[] {
  return (Object.keys(USE_EXTERNAL_API) as ApiEntity[]).filter(
    (entity) => USE_EXTERNAL_API[entity]
  );
}

/**
 * Check if any entity is using the external API
 */
export function isAnyEntityUsingExternalApi(): boolean {
  return Object.values(USE_EXTERNAL_API).some((enabled) => enabled);
}
