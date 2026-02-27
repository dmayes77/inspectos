import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(200, "Vendor name is too long"),
  contact_person: z.string().max(200, "Contact person is too long").optional().nullable(),
  vendor_type: z.string().max(100, "Vendor type is too long").optional().nullable(),
  email: z.string().email("Invalid email address").max(255).optional().nullable(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
  address_line1: z.string().max(255, "Address line 1 is too long").optional().nullable(),
  address_line2: z.string().max(255, "Address line 2 is too long").optional().nullable(),
  city: z.string().max(120, "City is too long").optional().nullable(),
  state_region: z.string().max(120, "State/region is too long").optional().nullable(),
  postal_code: z.string().max(20, "Postal code is too long").optional().nullable(),
  country: z.string().max(120, "Country is too long").optional().nullable(),
  notes: z.string().max(5000, "Notes are too long").optional().nullable(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateVendorSchema = createVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
