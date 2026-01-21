import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more").optional(),
  durationMinutes: z.coerce.number().min(15, "Duration must be 15 minutes or more").optional(),
  category: z.enum(["core", "addon"]).optional(),
  templateId: z.string().optional().nullable(),
  isPackage: z.boolean().optional(),
  includedServiceIds: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
