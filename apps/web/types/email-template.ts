export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string | null;
  description?: string | null;
  isSystem?: boolean;
};
