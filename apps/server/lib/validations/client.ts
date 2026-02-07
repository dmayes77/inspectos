import { z } from "zod";

/**
 * Validation schema for client API requests
 */
export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^[\d\s\-()+ ]*$/, "Invalid phone number format")
    .optional()
    .nullable(),
  type: z.enum(["Homebuyer", "Agent", "Seller", "Other"]).optional().nullable(),
  company: z.string().max(255, "Company name is too long").optional().nullable(),
  notes: z.string().max(5000, "Notes are too long").optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
