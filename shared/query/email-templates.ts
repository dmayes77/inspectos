export const emailTemplatesQueryKeys = {
  all: ["email-templates"] as const,
  list: () => ["email-templates", "list"] as const,
};
