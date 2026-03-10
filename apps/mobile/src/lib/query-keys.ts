export const mobileQueryKeys = {
  orders: (tenantSlug: string) => ['mobile', 'orders', tenantSlug] as const,
  order: (tenantSlug: string, orderId: string) => ['mobile', 'order', tenantSlug, orderId] as const,
  orderArrivalChecklist: (tenantSlug: string, orderId: string) => ['mobile', 'order', tenantSlug, orderId, 'arrival-checklist'] as const,
  orderInspectionDetail: (tenantSlug: string, orderId: string) => ['mobile', 'order', tenantSlug, orderId, 'inspection-detail'] as const,
  orderInspectionMedia: (tenantSlug: string, orderId: string, templateItemId?: string) =>
    ['mobile', 'order', tenantSlug, orderId, 'inspection-media', templateItemId ?? 'all'] as const,
  profile: () => ['mobile', 'profile'] as const,
  quickCaptures: (tenantSlug: string) => ['mobile', 'quick-captures', tenantSlug] as const,
  quickCaptureDetail: (tenantSlug: string, captureId: string) => ['mobile', 'quick-capture', tenantSlug, captureId] as const,
  pendingQuickCaptures: (tenantSlug: string) => ['mobile', 'quick-captures', tenantSlug, 'pending'] as const,
};
