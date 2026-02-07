import { z } from "zod";

/**
 * Validation schema for service API requests
 */
export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(255, "Service name is too long"),
  description: z.string().max(5000, "Description is too long").optional().nullable(),
  price: z.coerce.number().min(0, "Price must be a positive number").optional().nullable(),
  durationMinutes: z.coerce.number().min(15, "Duration must be at least 15 minutes").optional().nullable(),
  category: z.enum(["core", "addon"]).optional().nullable(),
  templateId: z.string().optional().nullable(),
  isPackage: z.boolean().optional().default(false),
  includedServiceIds: z.array(z.string()).optional().default([]),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
