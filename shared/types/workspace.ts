export type Workspace = {
  id: string;
  name: string;
  slug: string;
  businessId: string | null;
  role: string | null;
};

export type WorkspacesResponse = {
  workspaces: Workspace[];
};
