export type CRMClientProperty = {
  propertyId: string;
  propertyPublicId?: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
};

export type CRMClient = {
  clientId: string;
  publicId?: string;
  name: string;
  email: string;
  phone: string;
  type: "Homebuyer" | "Real Estate Agent" | "Seller" | string;
  inspections: number;
  lastInspection: string;
  totalSpent: number;
  createdAt: string | null;
  updatedAt: string | null;
  properties?: CRMClientProperty[];
  archived?: boolean;
};

export type CreateCRMClientInput = Omit<CRMClient, "clientId" | "archived">;
export type UpdateCRMClientInput = { clientId: string } & Partial<CRMClient>;
