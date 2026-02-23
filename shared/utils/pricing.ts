/**
 * Service pricing calculation utilities
 * Centralized logic for calculating service prices, packages, and totals
 */

export interface Service {
  serviceId: string;
  name: string;
  price?: number;
  durationMinutes?: number;
  isPackage?: boolean;
  includedServiceIds?: string[];
}

/**
 * Calculate the total price for selected services
 * Handles packages and individual services, avoiding double-counting
 * 
 * @param selectedServiceIds - Array of selected service IDs
 * @param services - Array of all available services
 * @returns Total price in dollars
 */
export function calculateServiceTotal(
  selectedServiceIds: string[],
  services: Service[]
): number {
  if (!Array.isArray(services) || services.length === 0) {
    return 0;
  }

  // Create a map for O(1) lookup
  const serviceMap = new Map<string, Service>(
    services.map((s) => [s.serviceId, s])
  );

  let total = 0;
  const added = new Set<string>();

  for (const serviceId of selectedServiceIds) {
    // Skip if already counted
    if (added.has(serviceId)) continue;

    const service = serviceMap.get(serviceId);
    if (!service) continue;

    // Handle packages
    if (service.isPackage && service.includedServiceIds?.length) {
      // If package has a price, use it
      if (typeof service.price === "number") {
        total += service.price;
        added.add(serviceId);
        // Mark included services as added to prevent double-counting
        service.includedServiceIds.forEach((id) => added.add(id));
      } else {
        // Otherwise, sum the included services
        for (const incId of service.includedServiceIds) {
          if (!added.has(incId)) {
            const inc = serviceMap.get(incId);
            if (inc && typeof inc.price === "number") {
              total += inc.price;
              added.add(incId);
            }
          }
        }
        added.add(serviceId);
      }
    } else if (typeof service.price === "number") {
      // Regular service
      total += service.price;
      added.add(serviceId);
    }
  }

  return total;
}

/**
 * Calculate the total duration (minutes) for selected services
 * Handles packages and individual services, avoiding double-counting
 */
export function calculateServiceDurationMinutes(
  selectedServiceIds: string[],
  services: Service[]
): number {
  if (!Array.isArray(services) || services.length === 0) {
    return 0;
  }

  const serviceMap = new Map<string, Service>(
    services.map((service) => [service.serviceId, service])
  );

  let total = 0;
  const added = new Set<string>();

  for (const serviceId of selectedServiceIds) {
    if (added.has(serviceId)) continue;

    const service = serviceMap.get(serviceId);
    if (!service) continue;

    if (service.isPackage && service.includedServiceIds?.length) {
      if (typeof service.durationMinutes === "number") {
        total += service.durationMinutes;
        added.add(serviceId);
        service.includedServiceIds.forEach((id) => added.add(id));
      } else {
        for (const incId of service.includedServiceIds) {
          if (!added.has(incId)) {
            const inc = serviceMap.get(incId);
            if (inc && typeof inc.durationMinutes === "number") {
              total += inc.durationMinutes;
              added.add(incId);
            }
          }
        }
        added.add(serviceId);
      }
    } else if (typeof service.durationMinutes === "number") {
      total += service.durationMinutes;
      added.add(serviceId);
    }
  }

  return total;
}

/**
 * Calculate package discount information
 * 
 * @param packageService - The package service
 * @param includedServices - Array of included services
 * @returns Discount calculation details
 */
export function calculatePackageDiscount(
  packageService: Service,
  includedServices: Service[]
): {
  totalIndividualPrice: number;
  packagePrice: number;
  discount: number;
  discountPercent: number;
} {
  const totalIndividualPrice = includedServices.reduce(
    (sum, service) => sum + (service.price || 0),
    0
  );
  
  const packagePrice = packageService.price || 0;
  const discount = totalIndividualPrice - packagePrice;
  const discountPercent =
    totalIndividualPrice > 0
      ? Math.round((discount / totalIndividualPrice) * 100)
      : 0;

  return {
    totalIndividualPrice,
    packagePrice,
    discount,
    discountPercent,
  };
}

/**
 * Format price as currency string
 * 
 * @param price - Price in dollars
 * @param currency - Currency code (default: USD)
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}
