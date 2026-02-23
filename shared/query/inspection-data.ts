export const inspectionDataQueryKeys = {
  all: ["inspection-data"] as const,
  detail: (orderId: string) => ["inspection-data", orderId] as const,
};
