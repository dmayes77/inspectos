import { z } from "zod";

const templateItemSchema = z.object({
  id: z.string().optional(),
  sectionId: z.string().optional(),
  name: z.string().min(1, "Item name is required").max(255, "Item name is too long"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  itemType: z.enum(["checkbox", "rating", "text", "number", "select", "photo"], {
    message: "Invalid item type",
  }),
  options: z.array(z.string().min(1, "Option cannot be empty").max(255, "Option is too long")).optional().nullable(),
  isRequired: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater").optional(),
});

const templateSectionSchema = z.object({
  id: z.string().optional(),
  templateId: z.string().optional(),
  name: z.string().min(1, "Section name is required").max(255, "Section name is too long"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater").optional(),
  items: z.array(templateItemSchema).optional(),
});

export const createTemplateStubSchema = z.object({
  action: z.literal("create_stub").optional(),
  name: z.string().min(1, "Template name is required").max(255, "Name is too long").optional(),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255, "Name is too long").optional(),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  type: z.enum(["inspection", "agreement", "report"], { message: "Invalid template type" }).optional(),
  standard: z.string().max(255, "Standard is too long").optional().nullable(),
  isDefault: z.boolean().optional(),
  usageCount: z.coerce.number().int().min(0, "Usage count must be 0 or greater").optional(),
  sections: z.array(templateSectionSchema).optional(),
  serviceId: z.string().min(1, "Service ID is required").optional().nullable(),
  serviceIds: z.array(z.string().min(1, "Service ID is required")).optional(),
});

export type CreateTemplateStubInput = z.infer<typeof createTemplateStubSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
