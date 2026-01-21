import { z } from "zod";

/**
 * Validation schema for inspection API create requests
 * Note: This is different from the form schema which has separate address fields
 */
export const createInspectionSchema = z.object({
  address: z.string().min(1, "Address is required"),
  clientId: z.string().min(1, "Client is required"),
  inspectorId: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional()
    .nullable(),
  types: z.array(z.string()).min(1, "At least one service type is required"),
  propertyType: z.string().optional().nullable(),
  yearBuilt: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  sqft: z.coerce.number().positive().optional().nullable(),
  bedrooms: z.coerce.number().int().min(1).optional().nullable(),
  bathrooms: z.coerce.number().min(1).max(10).optional().nullable(),
  stories: z.string().optional().nullable(),
  foundation: z.string().optional().nullable(),
  garage: z.string().optional().nullable(),
  pool: z.boolean().optional().nullable(),
  notes: z.string().max(5000, "Notes are too long").optional().nullable(),
});

export const updateInspectionSchema = createInspectionSchema.partial().extend({
  status: z.enum(["scheduled", "in_progress", "completed", "pending_report"], {
    message: "Invalid inspection status",
  }).optional(),
});

export const updateInspectionStatusSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "pending_report"], {
    message: "Invalid inspection status",
  }).optional(),
  notes: z.string().max(5000, "Notes are too long").optional().nullable(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;
export type UpdateInspectionStatusInput = z.infer<typeof updateInspectionStatusSchema>;
