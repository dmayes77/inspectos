import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required").max(200, "Vendor name is too long"),
  vendor_type: z.string().max(100, "Vendor type is too long").optional().nullable(),
  email: z.string().email("Invalid email address").max(255).optional().nullable(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateVendorSchema = createVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
