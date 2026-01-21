export type TemplateItemType =
  | "checkbox"
  | "rating"
  | "text"
  | "number"
  | "select"
  | "photo";

export type TemplateItem = {
  id: string;
  sectionId: string;
  name: string;
  description?: string;
  itemType: TemplateItemType;
  options?: string[];
  isRequired?: boolean;
  sortOrder: number;
};

export type TemplateSection = {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  sortOrder: number;
  items: TemplateItem[];
};

export type Template = {
  id: string;
  name: string;
  description?: string;
  type: "inspection" | "agreement" | "report";
  standard?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  serviceIds?: string[];
  serviceNames?: string[];
  basePrice?: number | null;
  isAddon?: boolean;
  isDefault?: boolean;
  usageCount?: number;
  lastModified?: string;
  sections: TemplateSection[];
};
