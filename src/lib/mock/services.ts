// In-memory mock for services and packages
import { generateReadableId } from "@/lib/id-generator";

export type Service = {
  serviceId: string;
  name: string;
  description?: string;
  price?: number;
  isPackage?: boolean;
  includedServiceIds?: string[]; // for packages
  includes?: string[]; // List of what's included (features/deliverables)
  status?: "active" | "inactive";
};

export const services: Service[] = [
  {
    serviceId: generateReadableId(), // was: "1",
    name: "Full Home Inspection",
    description: "Comprehensive inspection of all major systems",
    price: 425,
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
    serviceId: generateReadableId(), // was: "2",
    name: "Pre-Listing Inspection",
    description: "Prepare your home for sale",
    price: 350,
    includes: ["Comprehensive home inspection", "Identify potential deal-breakers", "Repair priority recommendations", "Digital report for buyers"],
  },
  {
    serviceId: generateReadableId(), // was: "3",
    name: "Radon Test",
    description: "Test for radon gas levels",
    price: 150,
    includes: ["48-hour continuous monitoring", "EPA-approved testing equipment", "Lab-certified results", "Mitigation recommendations if needed"],
  },
  {
    serviceId: generateReadableId(), // was: "4",
    name: "Mold Inspection",
    description: "Identify mold and moisture issues",
    price: 200,
    includes: ["Visual inspection of all areas", "Moisture meter readings", "Air quality sampling", "Lab analysis of samples", "Remediation recommendations"],
  },
  {
    serviceId: generateReadableId(), // was: "5",
    name: "Termite Inspection",
    description: "Check for wood-destroying insects",
    price: 125,
    includes: ["Interior and exterior inspection", "Crawl space examination", "Evidence documentation", "Treatment recommendations"],
  },
  {
    serviceId: generateReadableId(), // was: "6",
    name: "Pool/Spa Inspection",
    description: "Inspect pool and spa equipment",
    price: 100,
    includes: ["Pump and filter inspection", "Heater and electrical check", "Surface and structure evaluation", "Safety equipment verification"],
  },
  {
    serviceId: generateReadableId(), // was: "7",
    name: "Sewer Scope",
    description: "Camera inspection of sewer line",
    price: 175,
    includes: ["High-definition camera inspection", "Full sewer line assessment", "Video recording provided", "Blockage and damage identification"],
  },
  {
    serviceId: generateReadableId(), // was: "8",
    name: "4-Point Inspection",
    description: "Insurance-required inspection of critical systems",
    price: 175,
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
    serviceId: generateReadableId(), // was: "9",
    name: "Wind Mitigation Inspection",
    description: "Inspection to qualify for insurance discounts",
    price: 125,
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
    serviceId: generateReadableId(), // was: "10",
    name: "Well Water Testing",
    description: "Comprehensive water quality analysis",
    price: 225,
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
    serviceId: generateReadableId(), // was: "11",
    name: "Septic System Inspection",
    description: "Complete septic system evaluation",
    price: 350,
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
    serviceId: generateReadableId(), // was: "12",
    name: "Infrared Thermal Imaging",
    description: "Advanced diagnostic imaging service",
    price: 225,
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
    serviceId: generateReadableId(), // was: "13",
    name: "11th Month Warranty Inspection",
    description: "Pre-warranty expiration builder inspection",
    price: 400,
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
  const service: Service = {
    serviceId,
    name: data.name || "New Service",
    description: data.description,
    price: data.price,
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
  services[idx] = { ...services[idx], ...data };
  return services[idx];
}

export function deleteService(serviceId: string) {
  const idx = services.findIndex((s) => s.serviceId === serviceId);
  if (idx === -1) return false;
  services[idx].status = "inactive";
  return true;
}

export const addService = createService;
