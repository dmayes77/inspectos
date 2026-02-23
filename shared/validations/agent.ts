import { z } from "zod";

/**
 * Validation schema for agent API requests
 */

export const createAgentSchema = z.object({
  agency_id: z.string().uuid("Invalid agency ID").optional().nullable(),
  agency_name: z.string().max(255, "Agency name is too long").optional().nullable(),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^[\d\s\-()+ ]*$/, "Invalid phone number format")
    .optional()
    .nullable(),
  role: z.string().max(120, "Role is too long").optional().nullable(),
  license_number: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  notes: z.string().max(5000).optional().nullable(),
  preferred_report_format: z.enum(["pdf", "html", "both"]).optional(),
  notify_on_schedule: z.boolean().optional(),
  notify_on_complete: z.boolean().optional(),
  notify_on_report: z.boolean().optional(),
  portal_access_enabled: z.boolean().optional(),
  avatar_url: z.string().max(5_000_000, "Avatar data is too large").optional().nullable(),
  brand_logo_url: z.string().max(5000).optional().nullable(),
  agency_address: z.string().max(1000).optional().nullable(),
  agency_website: z.string().max(500).url("Invalid website").optional().nullable(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
