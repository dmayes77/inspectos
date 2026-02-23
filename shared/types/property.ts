export interface Property {
  id: string;
  tenant_id: string;
  client_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type: "single-family" | "condo-townhome" | "multi-family" | "manufactured" | "commercial";
  year_built: number | null;
  square_feet: number | null;
  notes: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  stories: string | null;
  foundation: string | null;
  garage: string | null;
  pool: boolean | null;
  basement: "none" | "unfinished" | "finished" | "partial" | null;
  lot_size_acres: number | null;
  heating_type: string | null;
  cooling_type: string | null;
  roof_type: string | null;
  building_class: "A" | "B" | "C" | null;
  loading_docks: number | null;
  zoning: string | null;
  occupancy_type: string | null;
  ceiling_height: number | null;
  number_of_units: number | null;
  unit_mix: string | null;
  laundry_type: "in-unit" | "shared" | "none" | null;
  parking_spaces: number | null;
  elevator: boolean | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  owners?: PropertyOwner[];
}

export type PropertyOwner = {
  propertyOwnerId: string;
  propertyId: string;
  clientId: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company?: string | null;
  } | null;
};

export interface CreatePropertyInput {
  client_id?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type?: Property["property_type"];
  year_built?: number | null;
  square_feet?: number | null;
  notes?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: string | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: boolean | null;
  basement?: Property["basement"];
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  roof_type?: string | null;
  building_class?: Property["building_class"];
  loading_docks?: number | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: number | null;
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: Property["laundry_type"];
  parking_spaces?: number | null;
  elevator?: boolean | null;
}

export interface UpdatePropertyInput {
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type?: Property["property_type"];
  year_built?: number | null;
  square_feet?: number | null;
  notes?: string | null;
  client_id?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  stories?: string | null;
  foundation?: string | null;
  garage?: string | null;
  pool?: boolean | null;
  basement?: Property["basement"];
  lot_size_acres?: number | null;
  heating_type?: string | null;
  cooling_type?: string | null;
  roof_type?: string | null;
  building_class?: Property["building_class"];
  loading_docks?: number | null;
  zoning?: string | null;
  occupancy_type?: string | null;
  ceiling_height?: number | null;
  number_of_units?: number | null;
  unit_mix?: string | null;
  laundry_type?: Property["laundry_type"];
  parking_spaces?: number | null;
  elevator?: boolean | null;
}

export interface PropertyFilters {
  client_id?: string;
}
