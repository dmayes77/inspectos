// In-memory mock for services and packages
import { generateReadableId } from "@/lib/id-generator";

export const SERVICE_IDS = {
  fullHome: "svc-full-home",
  preListing: "svc-pre-listing",
  radon: "svc-radon",
  mold: "svc-mold",
  termite: "svc-termite",
  poolSpa: "svc-pool-spa",
  sewerScope: "svc-sewer-scope",
  fourPoint: "svc-4-point",
  windMitigation: "svc-wind-mitigation",
  wellWater: "svc-well-water",
  septic: "svc-septic",
  infrared: "svc-infrared",
  eleventhMonth: "svc-11th-month",
} as const;

export type Service = {
  serviceId: string;
  name: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  templateId?: string | null;
  category?: "core" | "addon";
  isPackage?: boolean;
  includedServiceIds?: string[]; // for packages
  includes?: string[]; // List of what's included (features/deliverables)
  status?: "active" | "inactive";
};

export const services: Service[] = [
  {
    serviceId: SERVICE_IDS.fullHome,
    name: "Full Home Inspection",
    description: "Comprehensive inspection of all major systems",
    price: 425,
    durationMinutes: 240,
    templateId: "tpl-1",
    category: "core",
    includes: [
      "Complete structural assessment",
      "All major systems inspection (HVAC, plumbing, electrical)",
      "Roof and attic inspection",
      "Foundation and basement evaluation",
      "Detailed photo documentation",
      "Same-day digital report delivery",
    ],
  },
  {
    serviceId: SERVICE_IDS.preListing,
    name: "Pre-Listing Inspection",
    description: "Prepare your home for sale",
    price: 350,
    durationMinutes: 180,
    templateId: "tpl-2",
    category: "core",
    includes: ["Comprehensive home inspection", "Identify potential deal-breakers", "Repair priority recommendations", "Digital report for buyers"],
  },
  {
    serviceId: SERVICE_IDS.radon,
    name: "Radon Test",
    description: "Test for radon gas levels",
    price: 150,
    durationMinutes: 60,
    templateId: "tpl-16",
    category: "addon",
    includes: ["48-hour continuous monitoring", "EPA-approved testing equipment", "Lab-certified results", "Mitigation recommendations if needed"],
  },
  {
    serviceId: SERVICE_IDS.mold,
    name: "Mold Inspection",
    description: "Identify mold and moisture issues",
    price: 200,
    durationMinutes: 90,
    templateId: "tpl-17",
    category: "addon",
    includes: ["Visual inspection of all areas", "Moisture meter readings", "Air quality sampling", "Lab analysis of samples", "Remediation recommendations"],
  },
  {
    serviceId: SERVICE_IDS.termite,
    name: "Termite Inspection",
    description: "Check for wood-destroying insects",
    price: 125,
    durationMinutes: 60,
    templateId: "tpl-18",
    category: "addon",
    includes: ["Interior and exterior inspection", "Crawl space examination", "Evidence documentation", "Treatment recommendations"],
  },
  {
    serviceId: SERVICE_IDS.poolSpa,
    name: "Pool/Spa Inspection",
    description: "Inspect pool and spa equipment",
    price: 100,
    durationMinutes: 60,
    templateId: "tpl-19",
    category: "addon",
    includes: ["Pump and filter inspection", "Heater and electrical check", "Surface and structure evaluation", "Safety equipment verification"],
  },
  {
    serviceId: SERVICE_IDS.sewerScope,
    name: "Sewer Scope",
    description: "Camera inspection of sewer line",
    price: 175,
    durationMinutes: 90,
    templateId: "tpl-20",
    category: "addon",
    includes: ["High-definition camera inspection", "Full sewer line assessment", "Video recording provided", "Blockage and damage identification"],
  },
  {
    serviceId: SERVICE_IDS.fourPoint,
    name: "4-Point Inspection",
    description: "Insurance-required inspection of critical systems",
    price: 175,
    durationMinutes: 90,
    templateId: "tpl-21",
    category: "core",
    includes: [
      "Roof condition assessment",
      "HVAC system evaluation",
      "Electrical panel and wiring inspection",
      "Plumbing system inspection",
      "Insurance documentation",
      "Digital report with photos",
    ],
  },
  {
    serviceId: SERVICE_IDS.windMitigation,
    name: "Wind Mitigation Inspection",
    description: "Inspection to qualify for insurance discounts",
    price: 125,
    durationMinutes: 60,
    templateId: "tpl-22",
    category: "core",
    includes: [
      "Roof covering evaluation",
      "Roof deck attachment inspection",
      "Roof-to-wall connection assessment",
      "Opening protection verification",
      "Completed mitigation form",
      "Potential insurance savings report",
    ],
  },
  {
    serviceId: SERVICE_IDS.wellWater,
    name: "Well Water Testing",
    description: "Comprehensive water quality analysis",
    price: 225,
    durationMinutes: 60,
    templateId: "tpl-23",
    category: "addon",
    includes: [
      "Water sample collection",
      "Lab analysis for contaminants",
      "Bacteria and coliform testing",
      "pH and mineral content analysis",
      "Detailed results report",
      "Treatment recommendations if needed",
    ],
  },
  {
    serviceId: SERVICE_IDS.septic,
    name: "Septic System Inspection",
    description: "Complete septic system evaluation",
    price: 350,
    durationMinutes: 180,
    templateId: "tpl-24",
    category: "addon",
    includes: [
      "Tank location and access",
      "Liquid level measurement",
      "Sludge and scum layer assessment",
      "Drain field evaluation",
      "System capacity analysis",
      "Pumping and maintenance recommendations",
    ],
  },
  {
    serviceId: SERVICE_IDS.infrared,
    name: "Infrared Thermal Imaging",
    description: "Advanced diagnostic imaging service",
    price: 225,
    durationMinutes: 90,
    templateId: "tpl-25",
    category: "addon",
    includes: [
      "Thermal imaging of entire home",
      "Moisture intrusion detection",
      "Insulation gap identification",
      "Electrical hot spot detection",
      "HVAC duct leakage assessment",
      "Detailed thermal images in report",
    ],
  },
  {
    serviceId: SERVICE_IDS.eleventhMonth,
    name: "11th Month Warranty Inspection",
    description: "Pre-warranty expiration builder inspection",
    price: 400,
    durationMinutes: 240,
    templateId: "tpl-26",
    category: "core",
    includes: [
      "Complete home systems review",
      "Identify warranty-covered issues",
      "Document defects before expiration",
      "Comprehensive photo documentation",
      "Prioritized defect list for builder",
      "Detailed inspection report",
    ],
  },
];

export function getServices() {
  return services.filter((s) => s.status !== "inactive");
}

export function createService(data: Partial<Service>) {
  const serviceId = generateReadableId();
  const durationMinutes =
    data.durationMinutes ??
    (data.isPackage && Array.isArray(data.includedServiceIds)
      ? data.includedServiceIds
          .map((id) => services.find((s) => s.serviceId === id)?.durationMinutes || 0)
          .reduce((sum, value) => sum + value, 0)
      : undefined);
  const service: Service = {
    serviceId,
    name: data.name || "New Service",
    description: data.description,
    price: data.price,
    durationMinutes,
    templateId: data.templateId ?? null,
    category: data.category ?? "core",
    isPackage: !!data.isPackage,
    includedServiceIds: data.includedServiceIds || [],
    status: "active",
  };
  services.push(service);
  return service;
}

export function updateService(serviceId: string, data: Partial<Service>) {
  const idx = services.findIndex((s) => s.serviceId === serviceId);
  if (idx === -1) return null;
  const durationMinutes =
    data.durationMinutes ??
    (data.isPackage && Array.isArray(data.includedServiceIds)
      ? data.includedServiceIds
          .map((id) => services.find((s) => s.serviceId === id)?.durationMinutes || 0)
          .reduce((sum, value) => sum + value, 0)
      : services[idx].durationMinutes);
  services[idx] = { ...services[idx], ...data, durationMinutes, templateId: data.templateId ?? services[idx].templateId ?? null };
  return services[idx];
}

export function deleteService(serviceId: string) {
  const idx = services.findIndex((s) => s.serviceId === serviceId);
  if (idx === -1) return false;
  services[idx].status = "inactive";
  return true;
}

export const addService = createService;
