import { z } from "zod";

/**
 * Validation schema for property API requests
 */

export const createPropertySchema = z.object({
  client_id: z.string().uuid("Invalid client ID").optional().nullable(),
  address_line1: z.string().min(1, "Address is required").max(255, "Address is too long"),
  address_line2: z.string().max(255, "Address line 2 is too long").optional().nullable(),
  city: z.string().min(1, "City is required").max(100, "City is too long"),
  state: z.string().min(2, "State is required").max(2, "State must be 2 characters"),
  zip_code: z.string().min(5, "ZIP code is required").max(10, "ZIP code is too long"),
  property_type: z.enum([
    "single-family",
    "multi-family",
    "condo",
    "townhouse",
    "commercial",
    "industrial",
    "land",
    "other"
  ]).optional(),
  year_built: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 1).optional().nullable(),
  square_feet: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),

  // Residential-specific fields
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().min(0).optional().nullable(),
  stories: z.coerce.number().int().min(1).optional().nullable(),
  foundation: z.string().max(100).optional().nullable(),
  garage: z.string().max(100).optional().nullable(),
  pool: z.boolean().optional().nullable(),
  basement: z.boolean().optional().nullable(),
  lot_size_acres: z.coerce.number().min(0).optional().nullable(),
  heating_type: z.string().max(100).optional().nullable(),
  cooling_type: z.string().max(100).optional().nullable(),
  roof_type: z.string().max(100).optional().nullable(),

  // Commercial/Industrial-specific fields
  building_class: z.string().max(50).optional().nullable(),
  loading_docks: z.coerce.number().int().min(0).optional().nullable(),
  zoning: z.string().max(100).optional().nullable(),
  occupancy_type: z.string().max(100).optional().nullable(),
  ceiling_height: z.coerce.number().min(0).optional().nullable(),

  // Multi-family-specific fields
  number_of_units: z.coerce.number().int().min(1).optional().nullable(),
  unit_mix: z.string().max(500).optional().nullable(),
  laundry_type: z.string().max(100).optional().nullable(),
  parking_spaces: z.coerce.number().int().min(0).optional().nullable(),
  elevator: z.boolean().optional().nullable(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
