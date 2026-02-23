// Seed data for development — add real sample templates here if needed
export const templates: {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  standard?: string;
  isDefault?: boolean;
  usageCount?: number;
  sections: {
    name: string;
    description?: string | null;
    sortOrder?: number;
    items: {
      name: string;
      description?: string | null;
      itemType: string;
      options?: unknown;
      isRequired?: boolean;
      sortOrder?: number;
    }[];
  }[];
}[] = [];
