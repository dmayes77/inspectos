import { z } from "zod";

/**
 * Validation schema for property API requests
 */
export const createPropertySchema = z.object({
  client_id: z.string().optional().nullable(),
  address_line1: z.string().min(1, "Address is required").max(500, "Address is too long"),
  address_line2: z.string().max(500, "Address line 2 is too long").optional().nullable(),
  city: z.string().min(1, "City is required").max(100, "City is too long"),
  state: z.string().min(2, "State is required").max(2, "State must be 2 characters"),
  zip_code: z.string().min(5, "ZIP code must be at least 5 characters").max(10, "ZIP code is too long"),
  property_type: z.enum(["single-family", "condo-townhome", "multi-family", "manufactured", "commercial"]).optional().nullable(),
  year_built: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 1).optional().nullable(),
  square_feet: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().max(5000, "Notes are too long").optional().nullable(),

  // Common property details
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().min(0).optional().nullable(),
  stories: z.string().max(50).optional().nullable(),
  foundation: z.string().max(100).optional().nullable(),
  garage: z.string().max(100).optional().nullable(),
  pool: z.boolean().optional().nullable(),

  // Residential specific
  basement: z.enum(["none", "unfinished", "finished", "partial"]).optional().nullable(),
  lot_size_acres: z.coerce.number().min(0).optional().nullable(),
  heating_type: z.string().max(100).optional().nullable(),
  cooling_type: z.string().max(100).optional().nullable(),
  roof_type: z.string().max(100).optional().nullable(),

  // Commercial specific
  building_class: z.enum(["A", "B", "C"]).optional().nullable(),
  loading_docks: z.coerce.number().int().min(0).optional().nullable(),
  zoning: z.string().max(100).optional().nullable(),
  occupancy_type: z.string().max(100).optional().nullable(),
  ceiling_height: z.coerce.number().min(0).optional().nullable(),

  // Multi-family specific
  number_of_units: z.coerce.number().int().min(0).optional().nullable(),
  unit_mix: z.string().max(500).optional().nullable(),
  laundry_type: z.enum(["in-unit", "shared", "none"]).optional().nullable(),

  // Shared (commercial/multi-family)
  parking_spaces: z.coerce.number().int().min(0).optional().nullable(),
  elevator: z.boolean().optional().nullable(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
