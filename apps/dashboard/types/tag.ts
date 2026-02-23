export type TagScope = "lead" | "client" | "inspection" | "invoice" | "job" | "payment" | "service" | "template";
export type TagType = "stage" | "status" | "segment" | "source" | "priority" | "custom";

export type Tag = {
  id: string;
  name: string;
  scope: TagScope;
  tagType: TagType;
  description?: string;
  color?: string | null;
  isActive?: boolean;
};
