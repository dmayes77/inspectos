export type ServiceLookup = {
  serviceId: string;
  name: string;
  durationMinutes?: number;
  price?: number;
  isPackage?: boolean;
  includedServiceIds?: string[];
};

export const createServiceMap = (services: ServiceLookup[]) =>
  new Map<string, ServiceLookup>(services.map((service) => [service.serviceId, service]));

export const getServiceNameById = (id: string, serviceMap: Map<string, ServiceLookup>) =>
  serviceMap.get(id)?.name ?? id;

export const getServiceNamesByIds = (ids: string[], services: ServiceLookup[]) => {
  const serviceMap = createServiceMap(services);
  return ids.map((id) => getServiceNameById(id, serviceMap));
};

export const normalizeServiceIds = (values: string[] | string | undefined, services: ServiceLookup[]) => {
  if (!values) return [];
  const list = Array.isArray(values) ? values : [values];
  const serviceMap = createServiceMap(services);
  const nameToId = new Map(services.map((service) => [service.name.toLowerCase(), service.serviceId]));

  const normalized = list
    .map((value) => {
      if (!value) return null;
      if (serviceMap.has(value)) return value;
      const mapped = nameToId.get(value.toLowerCase());
      return mapped ?? null;
    })
    .filter((value): value is string => !!value);

  return Array.from(new Set(normalized));
};
