import { z } from "zod";

/**
 * Validation schema for inspection forms
 * Used with React Hook Form + Zod resolver
 */
export const inspectionSchema = z.object({
  // Address fields
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zip: z.string().regex(/^\d{5}$/, "ZIP must be 5 digits"),

  // Property details
  sqft: z.coerce.number().positive().optional().or(z.literal("")),
  yearBuilt: z.coerce
    .number()
    .int()
    .min(1800, "Year must be 1800 or later")
    .max(new Date().getFullYear(), `Year cannot exceed ${new Date().getFullYear()}`)
    .optional()
    .or(z.literal("")),
  bedrooms: z.coerce.number().int().min(1, "Must have at least 1 bedroom").optional().or(z.literal("")),
  bathrooms: z.coerce.number().min(1, "Must have at least 1 bathroom").max(10, "Cannot exceed 10 bathrooms").optional().or(z.literal("")),
  stories: z.string().optional(),
  propertyType: z.string().optional(),
  foundation: z.string().optional(),
  garage: z.string().optional(),
  pool: z.enum(["yes", "no"]).optional(),

  // Client & Inspector
  clientId: z.string().min(1, "Client is required"),
  inspectorId: z.string().min(1, "Inspector is required"),

  // Inspection details
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  status: z.string().optional(),
  notes: z.string().optional(),

  // Services (handled separately, but validated)
  types: z.array(z.string()).min(1, "At least one service is required"),
});

export type InspectionFormData = z.infer<typeof inspectionSchema>;
