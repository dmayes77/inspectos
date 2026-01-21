import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^[\d\s\-()+ ]*$/, "Invalid phone number format")
    .optional()
    .nullable(),
  stage: z
    .enum(["new", "contacted", "qualified", "proposal", "won", "lost"], {
      errorMap: () => ({ message: "Invalid lead stage" }),
    })
    .optional()
    .default("new"),
  source: z.string().max(100, "Source is too long").optional().nullable(),
  notes: z.string().max(5000, "Notes are too long").optional().nullable(),
  serviceName: z.string().max(255, "Service name is too long").optional().nullable(),
  requestedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .nullable()
    .or(z.literal("")),
  estimatedValue: z.coerce.number().min(0, "Value must be 0 or more").optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
