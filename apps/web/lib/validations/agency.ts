import { z } from "zod";

/**
 * Validation schema for agency API requests
 */

export const createAgencySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  license_number: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^[\d\s\-()+ ]*$/, "Invalid phone number format")
    .optional()
    .nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  address_line1: z.string().max(255).optional().nullable(),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip_code: z.string().max(20).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateAgencySchema = createAgencySchema.partial();

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
