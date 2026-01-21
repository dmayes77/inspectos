import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(100, "Tag name is too long"),
  scope: z.enum(["lead", "client", "inspection", "invoice", "job", "payment", "service", "template"], {
    errorMap: () => ({ message: "Invalid tag scope" }),
  }),
  tagType: z.enum(["stage", "status", "segment", "source", "priority", "custom"]).optional().default("custom"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g., #FF5733)")
    .optional()
    .nullable(),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
