import { z } from "zod";

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255, "Name is too long"),
  subject: z.string().min(1, "Subject is required").max(500, "Subject is too long"),
  body: z.string().min(1, "Body is required").max(50000, "Body is too long"),
  category: z
    .enum(["scheduling", "confirmation", "reminder", "report", "invoice", "follow_up", "other"], {
      errorMap: () => ({ message: "Invalid category" }),
    })
    .optional()
    .nullable(),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
});

export const updateEmailTemplateSchema = createEmailTemplateSchema.partial();

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
