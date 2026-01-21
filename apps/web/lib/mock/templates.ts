import type { Template, TemplateSection } from "@/types/template";
import { generateReadableId } from "@/lib/id-generator";
import { services } from "@/lib/mock/services";

type TemplatePricing = {
  serviceName: string;
  basePrice: number;
  isAddon?: boolean;
};

const templatePricing: Record<string, TemplatePricing> = {
  "tpl-1": { serviceName: "Full Home Inspection", basePrice: 425 },
  "tpl-2": { serviceName: "Pre-Listing Inspection", basePrice: 350 },
  "tpl-3": { serviceName: "Pre-Inspection Agreement", basePrice: 0 },
  "tpl-4": { serviceName: "Move-in / Move-out", basePrice: 275 },
  "tpl-5": { serviceName: "Home Inspection Report", basePrice: 400 },
  "tpl-6": { serviceName: "Basic Condition Report", basePrice: 225 },
  "tpl-7": { serviceName: "Sale / Appraisal Report", basePrice: 0 },
  "tpl-8": { serviceName: "Building Inspection", basePrice: 325 },
  "tpl-9": { serviceName: "Unit Inspection", basePrice: 175 },
  "tpl-10": { serviceName: "Cleaning Report", basePrice: 0 },
  "tpl-11": { serviceName: "Risk Assessment", basePrice: 200 },
  "tpl-12": { serviceName: "Fire & Safety Inspection", basePrice: 175, isAddon: true },
  "tpl-13": { serviceName: "Property Listing Details / Features", basePrice: 0 },
  "tpl-14": { serviceName: "Smoke / Carbon Monoxide Checks", basePrice: 95, isAddon: true },
  "tpl-15": { serviceName: "HMO Fire & Safety / Property Audit", basePrice: 250 },
  "tpl-16": { serviceName: "Radon Test", basePrice: 150, isAddon: true },
  "tpl-17": { serviceName: "Mold Inspection", basePrice: 200, isAddon: true },
  "tpl-18": { serviceName: "Termite Inspection", basePrice: 125, isAddon: true },
  "tpl-19": { serviceName: "Pool/Spa Inspection", basePrice: 100, isAddon: true },
  "tpl-20": { serviceName: "Sewer Scope", basePrice: 175, isAddon: true },
  "tpl-21": { serviceName: "4-Point Inspection", basePrice: 175 },
  "tpl-22": { serviceName: "Wind Mitigation Inspection", basePrice: 125 },
  "tpl-23": { serviceName: "Well Water Testing", basePrice: 225, isAddon: true },
  "tpl-24": { serviceName: "Septic System Inspection", basePrice: 350, isAddon: true },
  "tpl-25": { serviceName: "Infrared Thermal Imaging", basePrice: 225, isAddon: true },
  "tpl-26": { serviceName: "11th Month Warranty Inspection", basePrice: 400 },
};

const applyTemplatePricing = (template: Template): Template => {
  const serviceLink = services.find((service) => service.templateId === template.id);
  if (serviceLink) {
    return {
      ...template,
      serviceId: serviceLink.serviceId,
      serviceName: serviceLink.name,
      basePrice: serviceLink.price ?? null,
      isAddon: serviceLink.category === "addon",
    };
  }

  const pricing = templatePricing[template.id];
  if (!pricing) {
    return {
      ...template,
      serviceName: template.serviceName ?? null,
      basePrice: template.basePrice ?? null,
      isAddon: template.isAddon ?? false,
    };
  }

  return {
    ...template,
    serviceName: pricing.serviceName,
    basePrice: pricing.basePrice,
    isAddon: pricing.isAddon ?? false,
  };
};

export const templates: Template[] = [
  {
    id: "tpl-1",
    name: "Full Home Inspection",
    description: "Complete residential inspection template based on ASHI standards",
    type: "inspection",
    standard: "ASHI",
    isDefault: true,
    usageCount: 892,
    lastModified: "Jan 05, 2026",
    sections: [
      {
        id: "sec-1",
        templateId: "tpl-1",
        name: "Exterior",
        description: "Siding, roof, and exterior systems",
        sortOrder: 1,
        items: [
          { id: "item-1", sectionId: "sec-1", name: "Roof condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-2", sectionId: "sec-1", name: "Siding condition", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-3", sectionId: "sec-1", name: "Gutters present", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          {
            id: "item-4",
            sectionId: "sec-1",
            name: "Grading/drainage",
            itemType: "select",
            options: ["Good","Fair","Poor","N/A"],
            isRequired: false,
            sortOrder: 4,
          },
          { id: "item-5", sectionId: "sec-1", name: "Exterior photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-2",
        templateId: "tpl-1",
        name: "Interior",
        description: "Rooms, walls, and finishes",
        sortOrder: 2,
        items: [
          { id: "item-6", sectionId: "sec-2", name: "Walls condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-7", sectionId: "sec-2", name: "Floors condition", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-8", sectionId: "sec-2", name: "Windows/doors", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-9", sectionId: "sec-2", name: "Interior photos", itemType: "photo", isRequired: false, sortOrder: 4 },
          { id: "item-10", sectionId: "sec-2", name: "Notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-19",
        templateId: "tpl-1",
        name: "Structure",
        description: "Foundation, framing, and structural components",
        sortOrder: 3,
        items: [
          { id: "item-11", sectionId: "sec-19", name: "Foundation cracks observed", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          {
            id: "item-12",
            sectionId: "sec-19",
            name: "Structural movement",
            itemType: "select",
            options: ["None","Minor","Moderate","Major"],
            isRequired: false,
            sortOrder: 2,
          },
          { id: "item-13", sectionId: "sec-19", name: "Moisture signs", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-14", sectionId: "sec-19", name: "Floor leveling", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-15", sectionId: "sec-19", name: "Notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-20",
        templateId: "tpl-1",
        name: "Electrical",
        description: "Service panel, wiring, and outlets",
        sortOrder: 4,
        items: [
          { id: "item-16", sectionId: "sec-20", name: "Panel condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-17", sectionId: "sec-20", name: "GFCI tested", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-18", sectionId: "sec-20", name: "Smoke detectors", itemType: "checkbox", isRequired: true, sortOrder: 3 },
          {
            id: "item-19",
            sectionId: "sec-20",
            name: "Wiring type",
            itemType: "select",
            options: ["Copper","Aluminum","Mixed","Unknown"],
            isRequired: false,
            sortOrder: 4,
          },
          { id: "item-20", sectionId: "sec-20", name: "Notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-21",
        templateId: "tpl-1",
        name: "Plumbing",
        description: "Water supply, drains, and fixtures",
        sortOrder: 5,
        items: [
          { id: "item-21", sectionId: "sec-21", name: "Water pressure", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-22", sectionId: "sec-21", name: "Visible leaks", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-23", sectionId: "sec-21", name: "Water heater age (years)", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-24", sectionId: "sec-21", name: "Drain flow", itemType: "rating", isRequired: false, sortOrder: 4 },
          {
            id: "item-25",
            sectionId: "sec-21",
            name: "Pipe material",
            itemType: "select",
            options: ["Copper","PVC","PEX","Galvanized","Mixed","Unknown"],
            isRequired: false,
            sortOrder: 5,
          },
          { id: "item-26", sectionId: "sec-21", name: "Notes", itemType: "text", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-22",
        templateId: "tpl-1",
        name: "HVAC",
        description: "Heating and cooling systems",
        sortOrder: 6,
        items: [
          { id: "item-27", sectionId: "sec-22", name: "Cooling operation", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-28", sectionId: "sec-22", name: "Heating operation", itemType: "rating", isRequired: false, sortOrder: 2 },
          {
            id: "item-29",
            sectionId: "sec-22",
            name: "Filter condition",
            itemType: "select",
            options: ["Clean","Dirty","Missing","N/A"],
            isRequired: false,
            sortOrder: 3,
          },
          { id: "item-30", sectionId: "sec-22", name: "Thermostat operation", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-31", sectionId: "sec-22", name: "Notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-23",
        templateId: "tpl-1",
        name: "Attic / Crawlspace",
        description: "Insulation and ventilation",
        sortOrder: 7,
        items: [
          {
            id: "item-32",
            sectionId: "sec-23",
            name: "Insulation level",
            itemType: "select",
            options: ["Adequate","Needs improvement","Missing","N/A"],
            isRequired: false,
            sortOrder: 1,
          },
          { id: "item-33", sectionId: "sec-23", name: "Ventilation adequate", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-34", sectionId: "sec-23", name: "Moisture signs", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-35", sectionId: "sec-23", name: "Pest activity", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-36", sectionId: "sec-23", name: "Photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-24",
        templateId: "tpl-1",
        name: "Safety",
        description: "Safety devices and hazards",
        sortOrder: 8,
        items: [
          { id: "item-37", sectionId: "sec-24", name: "Handrails secure", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-38", sectionId: "sec-24", name: "Trip hazards", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-39", sectionId: "sec-24", name: "Smoke/CO detectors working", itemType: "checkbox", isRequired: true, sortOrder: 3 },
          { id: "item-40", sectionId: "sec-24", name: "Notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-65",
        templateId: "tpl-1",
        name: "Kitchen",
        description: "Cabinets, counters, and fixtures",
        sortOrder: 9,
        items: [
          { id: "item-275", sectionId: "sec-65", name: "Cabinets condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-276", sectionId: "sec-65", name: "Counters condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-277", sectionId: "sec-65", name: "Sink/faucet leaks", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-278", sectionId: "sec-65", name: "GFCI at sink", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-279", sectionId: "sec-65", name: "Range hood vented", itemType: "checkbox", isRequired: false, sortOrder: 5 },
          { id: "item-280", sectionId: "sec-65", name: "Kitchen photos", itemType: "photo", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-66",
        templateId: "tpl-1",
        name: "Bathrooms",
        description: "Fixtures, ventilation, and moisture",
        sortOrder: 10,
        items: [
          { id: "item-281", sectionId: "sec-66", name: "Fixture condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-282", sectionId: "sec-66", name: "Water pressure", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-283", sectionId: "sec-66", name: "Grout/sealant condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-284", sectionId: "sec-66", name: "Vent fan working", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-285", sectionId: "sec-66", name: "Leaks observed", itemType: "checkbox", isRequired: false, sortOrder: 5 },
          { id: "item-286", sectionId: "sec-66", name: "Bathroom photos", itemType: "photo", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-67",
        templateId: "tpl-1",
        name: "Bedrooms",
        description: "Walls, floors, windows, and doors",
        sortOrder: 11,
        items: [
          { id: "item-287", sectionId: "sec-67", name: "Walls/ceilings", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-288", sectionId: "sec-67", name: "Flooring condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-289", sectionId: "sec-67", name: "Windows operation", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-290", sectionId: "sec-67", name: "Closet doors", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-291", sectionId: "sec-67", name: "Bedroom photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-68",
        templateId: "tpl-1",
        name: "Appliances",
        description: "Built-in and installed appliances",
        sortOrder: 12,
        items: [
          { id: "item-292", sectionId: "sec-68", name: "Dishwasher operational", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-293", sectionId: "sec-68", name: "Oven/range operational", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-294", sectionId: "sec-68", name: "Microwave operational", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-295", sectionId: "sec-68", name: "Refrigerator operational", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-296", sectionId: "sec-68", name: "Washer/dryer operational", itemType: "checkbox", isRequired: false, sortOrder: 5 },
          { id: "item-297", sectionId: "sec-68", name: "Appliance notes", itemType: "text", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-69",
        templateId: "tpl-1",
        name: "Garage",
        description: "Garage structure and safety features",
        sortOrder: 13,
        items: [
          { id: "item-298", sectionId: "sec-69", name: "Door operation", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-299", sectionId: "sec-69", name: "Auto-reverse works", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-300", sectionId: "sec-69", name: "Fire separation intact", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-301", sectionId: "sec-69", name: "GFCI present", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-302", sectionId: "sec-69", name: "Garage floor condition", itemType: "rating", isRequired: false, sortOrder: 5 },
          { id: "item-303", sectionId: "sec-69", name: "Garage photos", itemType: "photo", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-70",
        templateId: "tpl-1",
        name: "Basement",
        description: "Moisture, structure, and access",
        sortOrder: 14,
        items: [
          { id: "item-304", sectionId: "sec-70", name: "Moisture evidence", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-305", sectionId: "sec-70", name: "Sump pump operational", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-306", sectionId: "sec-70", name: "Foundation walls", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-307", sectionId: "sec-70", name: "Electrical access", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-308", sectionId: "sec-70", name: "Basement photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-71",
        templateId: "tpl-1",
        name: "Fireplace / Chimney",
        description: "Fireplace components and chimney exterior",
        sortOrder: 15,
        items: [
          { id: "item-309", sectionId: "sec-71", name: "Fireplace condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-310", sectionId: "sec-71", name: "Damper operates", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-311", sectionId: "sec-71", name: "Chimney exterior condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-312", sectionId: "sec-71", name: "Gas shutoff present", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-313", sectionId: "sec-71", name: "Fireplace photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-72",
        templateId: "tpl-1",
        name: "Site / Grounds",
        description: "Walkways, drainage, and exterior features",
        sortOrder: 16,
        items: [
          { id: "item-314", sectionId: "sec-72", name: "Walkways condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-315", sectionId: "sec-72", name: "Deck/porch condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-316", sectionId: "sec-72", name: "Railings secure", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-317", sectionId: "sec-72", name: "Exterior lighting", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-318", sectionId: "sec-72", name: "Fence/gate condition", itemType: "rating", isRequired: false, sortOrder: 5 },
          { id: "item-319", sectionId: "sec-72", name: "Irrigation system", itemType: "checkbox", isRequired: false, sortOrder: 6 },
          { id: "item-320", sectionId: "sec-72", name: "Site photos", itemType: "photo", isRequired: false, sortOrder: 7 },
        ],
      },
    ],
  },
  {
    id: "tpl-2",
    name: "Pre-Listing Inspection",
    description: "Condensed inspection template for sellers preparing to list",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 234,
    lastModified: "Dec 10, 2025",
    sections: [
      {
        id: "sec-3",
        templateId: "tpl-2",
        name: "Quick Exterior",
        sortOrder: 1,
        items: [
          { id: "item-41", sectionId: "sec-3", name: "Roof visible damage", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-42", sectionId: "sec-3", name: "Siding/paint condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-43", sectionId: "sec-3", name: "Driveway condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-44", sectionId: "sec-3", name: "Exterior photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-25",
        templateId: "tpl-2",
        name: "Major Systems",
        sortOrder: 2,
        items: [
          { id: "item-45", sectionId: "sec-25", name: "HVAC operational", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-46", sectionId: "sec-25", name: "Plumbing leaks observed", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-47", sectionId: "sec-25", name: "Electrical panel condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-48", sectionId: "sec-25", name: "Water heater age (years)", itemType: "number", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-26",
        templateId: "tpl-2",
        name: "Safety Snapshot",
        sortOrder: 3,
        items: [
          { id: "item-49", sectionId: "sec-26", name: "Smoke detectors present", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-50", sectionId: "sec-26", name: "Trip hazards", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          {
            id: "item-51",
            sectionId: "sec-26",
            name: "Overall readiness",
            itemType: "select",
            options: ["Ready to list","Minor fixes needed","Major fixes needed"],
            isRequired: true,
            sortOrder: 3,
          },
          { id: "item-52", sectionId: "sec-26", name: "Notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-3",
    name: "Pre-Inspection Agreement",
    description: "Standard pre-inspection agreement for client signature",
    type: "agreement",
    standard: null,
    isDefault: true,
    usageCount: 1247,
    lastModified: "Jan 02, 2026",
    sections: [
      {
        id: "sec-27",
        templateId: "tpl-3",
        name: "Parties & Property",
        sortOrder: 1,
        items: [
          { id: "item-53", sectionId: "sec-27", name: "Client name", itemType: "text", isRequired: true, sortOrder: 1 },
          { id: "item-54", sectionId: "sec-27", name: "Client email", itemType: "text", isRequired: true, sortOrder: 2 },
          { id: "item-55", sectionId: "sec-27", name: "Property address", itemType: "text", isRequired: true, sortOrder: 3 },
          { id: "item-56", sectionId: "sec-27", name: "Inspection date", itemType: "text", isRequired: true, sortOrder: 4 },
          { id: "item-57", sectionId: "sec-27", name: "Agent present", itemType: "checkbox", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-28",
        templateId: "tpl-3",
        name: "Scope & Standards",
        sortOrder: 2,
        items: [
          {
            id: "item-58",
            sectionId: "sec-28",
            name: "Inspection standard",
            itemType: "select",
            options: ["ASHI","InterNACHI","State Standard","Custom"],
            isRequired: true,
            sortOrder: 1,
          },
          { id: "item-59", sectionId: "sec-28", name: "Scope summary", itemType: "text", isRequired: true, sortOrder: 2 },
          { id: "item-60", sectionId: "sec-28", name: "Excluded systems acknowledged", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-61", sectionId: "sec-28", name: "Client acknowledges limitations", itemType: "checkbox", isRequired: true, sortOrder: 4 },
        ],
      },
      {
        id: "sec-29",
        templateId: "tpl-3",
        name: "Fees & Payment",
        sortOrder: 3,
        items: [
          { id: "item-62", sectionId: "sec-29", name: "Inspection fee", itemType: "number", isRequired: true, sortOrder: 1 },
          {
            id: "item-63",
            sectionId: "sec-29",
            name: "Payment method",
            itemType: "select",
            options: ["Credit card","ACH","Check","Cash"],
            isRequired: true,
            sortOrder: 2,
          },
          {
            id: "item-64",
            sectionId: "sec-29",
            name: "Payment timing",
            itemType: "select",
            options: ["Before inspection","At inspection","Upon delivery"],
            isRequired: false,
            sortOrder: 3,
          },
          { id: "item-65", sectionId: "sec-29", name: "Cancellation policy acknowledged", itemType: "checkbox", isRequired: true, sortOrder: 4 },
          { id: "item-66", sectionId: "sec-29", name: "Refund policy acknowledged", itemType: "checkbox", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-30",
        templateId: "tpl-3",
        name: "Authorization",
        sortOrder: 4,
        items: [
          { id: "item-67", sectionId: "sec-30", name: "Permission to inspect", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-68", sectionId: "sec-30", name: "Photo/video consent", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-69", sectionId: "sec-30", name: "Client initials", itemType: "text", isRequired: true, sortOrder: 3 },
        ],
      },
      {
        id: "sec-31",
        templateId: "tpl-3",
        name: "Signatures",
        sortOrder: 5,
        items: [
          { id: "item-70", sectionId: "sec-31", name: "Client signature", itemType: "text", isRequired: true, sortOrder: 1 },
          { id: "item-71", sectionId: "sec-31", name: "Inspector signature", itemType: "text", isRequired: true, sortOrder: 2 },
          { id: "item-72", sectionId: "sec-31", name: "Signature photo", itemType: "photo", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-4",
    name: "Move-in / Move-out",
    description: "Condition checklist for tenant move-in and move-out",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 412,
    lastModified: "Jan 12, 2026",
    sections: [
      {
        id: "sec-4",
        templateId: "tpl-4",
        name: "Entry & Living Areas",
        sortOrder: 1,
        items: [
          { id: "item-73", sectionId: "sec-4", name: "Floors condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-74", sectionId: "sec-4", name: "Walls condition", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-75", sectionId: "sec-4", name: "Ceilings condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-76", sectionId: "sec-4", name: "Windows/screens", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-77", sectionId: "sec-4", name: "Doors/locks working", itemType: "checkbox", isRequired: true, sortOrder: 5 },
          { id: "item-78", sectionId: "sec-4", name: "Photos", itemType: "photo", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-5",
        templateId: "tpl-4",
        name: "Kitchen",
        sortOrder: 2,
        items: [
          { id: "item-79", sectionId: "sec-5", name: "Appliances working", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-80", sectionId: "sec-5", name: "Counters condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-81", sectionId: "sec-5", name: "Cabinets condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-82", sectionId: "sec-5", name: "Sink/faucet leaks", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-83", sectionId: "sec-5", name: "Flooring condition", itemType: "rating", isRequired: false, sortOrder: 5 },
          { id: "item-84", sectionId: "sec-5", name: "Kitchen photos", itemType: "photo", isRequired: false, sortOrder: 6 },
        ],
      },
      {
        id: "sec-32",
        templateId: "tpl-4",
        name: "Bedrooms",
        sortOrder: 3,
        items: [
          { id: "item-85", sectionId: "sec-32", name: "Walls condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-86", sectionId: "sec-32", name: "Floors condition", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-87", sectionId: "sec-32", name: "Closets condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-88", sectionId: "sec-32", name: "Windows/screens", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-89", sectionId: "sec-32", name: "Bedroom photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-33",
        templateId: "tpl-4",
        name: "Bathrooms",
        sortOrder: 4,
        items: [
          { id: "item-90", sectionId: "sec-33", name: "Toilet functional", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-91", sectionId: "sec-33", name: "Tub/shower condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-92", sectionId: "sec-33", name: "Sink/faucet condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-93", sectionId: "sec-33", name: "Vent fan working", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-94", sectionId: "sec-33", name: "Bathroom photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-34",
        templateId: "tpl-4",
        name: "Utilities & Appliances",
        sortOrder: 5,
        items: [
          { id: "item-95", sectionId: "sec-34", name: "Water heater operational", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-96", sectionId: "sec-34", name: "HVAC operational", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-97", sectionId: "sec-34", name: "Washer/dryer present", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-98", sectionId: "sec-34", name: "Electrical outlets working", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-99", sectionId: "sec-34", name: "Utility notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-35",
        templateId: "tpl-4",
        name: "Notes & Media",
        sortOrder: 6,
        items: [
          { id: "item-100", sectionId: "sec-35", name: "General notes", itemType: "text", isRequired: false, sortOrder: 1 },
          { id: "item-101", sectionId: "sec-35", name: "Damage summary", itemType: "text", isRequired: false, sortOrder: 2 },
          { id: "item-102", sectionId: "sec-35", name: "Additional photos", itemType: "photo", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-5",
    name: "Home Inspection Report",
    description: "Full residential inspection report template",
    type: "inspection",
    standard: "ASHI",
    isDefault: false,
    usageCount: 1560,
    lastModified: "Jan 08, 2026",
    sections: [
      {
        id: "sec-6",
        templateId: "tpl-5",
        name: "Roof",
        sortOrder: 1,
        items: [
          { id: "item-103", sectionId: "sec-6", name: "Roof covering", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-104", sectionId: "sec-6", name: "Flashing present", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-105", sectionId: "sec-6", name: "Roof penetrations sealed", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-106", sectionId: "sec-6", name: "Roof age (years)", itemType: "number", isRequired: false, sortOrder: 4 },
          { id: "item-107", sectionId: "sec-6", name: "Roof photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-7",
        templateId: "tpl-5",
        name: "Electrical",
        sortOrder: 2,
        items: [
          { id: "item-108", sectionId: "sec-7", name: "Panel condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-109", sectionId: "sec-7", name: "GFCI tested", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-110", sectionId: "sec-7", name: "AFCI present", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          {
            id: "item-111",
            sectionId: "sec-7",
            name: "Panel brand",
            itemType: "select",
            options: ["Square D","Siemens","GE","Cutler-Hammer","Other","Unknown"],
            isRequired: false,
            sortOrder: 4,
          },
          { id: "item-112", sectionId: "sec-7", name: "Electrical notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-36",
        templateId: "tpl-5",
        name: "Plumbing",
        sortOrder: 3,
        items: [
          { id: "item-113", sectionId: "sec-36", name: "Water heater condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-114", sectionId: "sec-36", name: "Visible leaks", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-115", sectionId: "sec-36", name: "Main shutoff located", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-116", sectionId: "sec-36", name: "Pipe material", itemType: "select", options: ["Copper","PVC","PEX","Galvanized","Mixed"], isRequired: false, sortOrder: 4 },
          { id: "item-117", sectionId: "sec-36", name: "Plumbing notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-37",
        templateId: "tpl-5",
        name: "HVAC",
        sortOrder: 4,
        items: [
          { id: "item-118", sectionId: "sec-37", name: "Cooling operation", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-119", sectionId: "sec-37", name: "Heating operation", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-120", sectionId: "sec-37", name: "System age (years)", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-121", sectionId: "sec-37", name: "Filter replaced", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-122", sectionId: "sec-37", name: "HVAC notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-38",
        templateId: "tpl-5",
        name: "Interior",
        sortOrder: 5,
        items: [
          { id: "item-123", sectionId: "sec-38", name: "Walls condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-124", sectionId: "sec-38", name: "Floors condition", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-125", sectionId: "sec-38", name: "Windows condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-126", sectionId: "sec-38", name: "Doors/locks", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-127", sectionId: "sec-38", name: "Interior notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-39",
        templateId: "tpl-5",
        name: "Exterior",
        sortOrder: 6,
        items: [
          { id: "item-128", sectionId: "sec-39", name: "Siding condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-129", sectionId: "sec-39", name: "Decks/porches", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-130", sectionId: "sec-39", name: "Driveway condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-131", sectionId: "sec-39", name: "Drainage", itemType: "select", options: ["Good","Fair","Poor"], isRequired: false, sortOrder: 4 },
          { id: "item-132", sectionId: "sec-39", name: "Exterior notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-40",
        templateId: "tpl-5",
        name: "Attic / Crawlspace",
        sortOrder: 7,
        items: [
          { id: "item-133", sectionId: "sec-40", name: "Insulation level", itemType: "select", options: ["Adequate","Low","Missing"], isRequired: false, sortOrder: 1 },
          { id: "item-134", sectionId: "sec-40", name: "Ventilation", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-135", sectionId: "sec-40", name: "Moisture signs", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-136", sectionId: "sec-40", name: "Attic photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-41",
        templateId: "tpl-5",
        name: "Summary",
        sortOrder: 8,
        items: [
          { id: "item-137", sectionId: "sec-41", name: "Overall condition", itemType: "select", options: ["Excellent","Good","Fair","Poor"], isRequired: true, sortOrder: 1 },
          { id: "item-138", sectionId: "sec-41", name: "Major concerns", itemType: "text", isRequired: false, sortOrder: 2 },
          { id: "item-139", sectionId: "sec-41", name: "Recommended actions", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-6",
    name: "Basic Condition Report",
    description: "High-level condition overview for quick assessments",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 278,
    lastModified: "Jan 04, 2026",
    sections: [
      {
        id: "sec-8",
        templateId: "tpl-6",
        name: "Structure",
        sortOrder: 1,
        items: [
          { id: "item-140", sectionId: "sec-8", name: "Foundation condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-141", sectionId: "sec-8", name: "Walls/structure condition", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-142", sectionId: "sec-8", name: "Visible cracks", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-143", sectionId: "sec-8", name: "Structure notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-42",
        templateId: "tpl-6",
        name: "Systems",
        sortOrder: 2,
        items: [
          { id: "item-144", sectionId: "sec-42", name: "Electrical condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-145", sectionId: "sec-42", name: "Plumbing condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-146", sectionId: "sec-42", name: "HVAC condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-147", sectionId: "sec-42", name: "System notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-43",
        templateId: "tpl-6",
        name: "Interior & Exterior",
        sortOrder: 3,
        items: [
          { id: "item-148", sectionId: "sec-43", name: "Interior condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-149", sectionId: "sec-43", name: "Exterior condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-150", sectionId: "sec-43", name: "Photos", itemType: "photo", isRequired: false, sortOrder: 3 },
          { id: "item-151", sectionId: "sec-43", name: "Overall notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-7",
    name: "Sale / Appraisal Report",
    description: "Inspection summary for property sale or appraisal",
    type: "report",
    standard: "Custom",
    isDefault: false,
    usageCount: 86,
    lastModified: "Dec 28, 2025",
    sections: [
      {
        id: "sec-9",
        templateId: "tpl-7",
        name: "Property Overview",
        sortOrder: 1,
        items: [
          { id: "item-152", sectionId: "sec-9", name: "Summary notes", itemType: "text", isRequired: true, sortOrder: 1 },
          { id: "item-153", sectionId: "sec-9", name: "Year built", itemType: "number", isRequired: false, sortOrder: 2 },
          { id: "item-154", sectionId: "sec-9", name: "Bedrooms/bathrooms", itemType: "text", isRequired: false, sortOrder: 3 },
          { id: "item-155", sectionId: "sec-9", name: "Square footage", itemType: "number", isRequired: false, sortOrder: 4 },
          { id: "item-156", sectionId: "sec-9", name: "Photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-44",
        templateId: "tpl-7",
        name: "Marketability",
        sortOrder: 2,
        items: [
          { id: "item-157", sectionId: "sec-44", name: "Curb appeal", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-158", sectionId: "sec-44", name: "Notable upgrades", itemType: "text", isRequired: false, sortOrder: 2 },
          { id: "item-159", sectionId: "sec-44", name: "Recommended repairs", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-45",
        templateId: "tpl-7",
        name: "Photo Set",
        sortOrder: 3,
        items: [
          { id: "item-160", sectionId: "sec-45", name: "Exterior photos", itemType: "photo", isRequired: false, sortOrder: 1 },
          { id: "item-161", sectionId: "sec-45", name: "Interior photos", itemType: "photo", isRequired: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: "tpl-8",
    name: "Building Inspection",
    description: "Commercial building inspection checklist",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 143,
    lastModified: "Jan 01, 2026",
    sections: [
      {
        id: "sec-10",
        templateId: "tpl-8",
        name: "Structure & Envelope",
        sortOrder: 1,
        items: [
          { id: "item-162", sectionId: "sec-10", name: "Exterior walls", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-163", sectionId: "sec-10", name: "Roof drainage", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-164", sectionId: "sec-10", name: "Facade condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-165", sectionId: "sec-10", name: "Windows/doors condition", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-166", sectionId: "sec-10", name: "Envelope notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-11",
        templateId: "tpl-8",
        name: "Mechanical",
        sortOrder: 2,
        items: [
          { id: "item-167", sectionId: "sec-11", name: "HVAC operation", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-168", sectionId: "sec-11", name: "Boiler condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-169", sectionId: "sec-11", name: "Mechanical room access", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-170", sectionId: "sec-11", name: "Ventilation adequate", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-171", sectionId: "sec-11", name: "Mechanical notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-46",
        templateId: "tpl-8",
        name: "Electrical",
        sortOrder: 3,
        items: [
          { id: "item-172", sectionId: "sec-46", name: "Main service condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-173", sectionId: "sec-46", name: "Emergency lighting", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-174", sectionId: "sec-46", name: "Generator present", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-175", sectionId: "sec-46", name: "Electrical notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-47",
        templateId: "tpl-8",
        name: "Life Safety",
        sortOrder: 4,
        items: [
          { id: "item-176", sectionId: "sec-47", name: "Fire alarm panel", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-177", sectionId: "sec-47", name: "Sprinkler system", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-178", sectionId: "sec-47", name: "Exit signage", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-179", sectionId: "sec-47", name: "Life safety notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-48",
        templateId: "tpl-8",
        name: "Site & Access",
        sortOrder: 5,
        items: [
          { id: "item-180", sectionId: "sec-48", name: "Parking condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-181", sectionId: "sec-48", name: "ADA access", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-182", sectionId: "sec-48", name: "Exterior lighting", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-183", sectionId: "sec-48", name: "Site notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-9",
    name: "Unit Inspection",
    description: "Unit-level inspection for multifamily properties",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 204,
    lastModified: "Jan 06, 2026",
    sections: [
      {
        id: "sec-12",
        templateId: "tpl-9",
        name: "Living Areas",
        sortOrder: 1,
        items: [
          { id: "item-184", sectionId: "sec-12", name: "Floors", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-185", sectionId: "sec-12", name: "Walls", itemType: "rating", isRequired: true, sortOrder: 2 },
          { id: "item-186", sectionId: "sec-12", name: "Ceilings", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-187", sectionId: "sec-12", name: "Living area photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-49",
        templateId: "tpl-9",
        name: "Kitchen",
        sortOrder: 2,
        items: [
          { id: "item-188", sectionId: "sec-49", name: "Appliances operational", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-189", sectionId: "sec-49", name: "Counters condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-190", sectionId: "sec-49", name: "Cabinets condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-191", sectionId: "sec-49", name: "Kitchen photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-50",
        templateId: "tpl-9",
        name: "Bathroom",
        sortOrder: 3,
        items: [
          { id: "item-192", sectionId: "sec-50", name: "Toilet functional", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-193", sectionId: "sec-50", name: "Tub/shower condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-194", sectionId: "sec-50", name: "Vent fan working", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-195", sectionId: "sec-50", name: "Bathroom photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-51",
        templateId: "tpl-9",
        name: "Safety",
        sortOrder: 4,
        items: [
          { id: "item-196", sectionId: "sec-51", name: "Smoke detectors present", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-197", sectionId: "sec-51", name: "Window egress", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-198", sectionId: "sec-51", name: "Safety notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-10",
    name: "Cleaning Report",
    description: "Post-cleaning condition checklist",
    type: "report",
    standard: "Custom",
    isDefault: false,
    usageCount: 64,
    lastModified: "Dec 20, 2025",
    sections: [
      {
        id: "sec-13",
        templateId: "tpl-10",
        name: "Room Cleanliness",
        sortOrder: 1,
        items: [
          { id: "item-199", sectionId: "sec-13", name: "Living room cleaned", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-200", sectionId: "sec-13", name: "Bedrooms cleaned", itemType: "checkbox", isRequired: true, sortOrder: 2 },
          { id: "item-201", sectionId: "sec-13", name: "Hallways cleaned", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-202", sectionId: "sec-13", name: "Windows cleaned", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-203", sectionId: "sec-13", name: "Room photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-52",
        templateId: "tpl-10",
        name: "Kitchen",
        sortOrder: 2,
        items: [
          { id: "item-204", sectionId: "sec-52", name: "Counters sanitized", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-205", sectionId: "sec-52", name: "Appliances cleaned", itemType: "checkbox", isRequired: true, sortOrder: 2 },
          { id: "item-206", sectionId: "sec-52", name: "Sink cleaned", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-207", sectionId: "sec-52", name: "Kitchen notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-53",
        templateId: "tpl-10",
        name: "Bathrooms",
        sortOrder: 3,
        items: [
          { id: "item-208", sectionId: "sec-53", name: "Toilets cleaned", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-209", sectionId: "sec-53", name: "Showers/tubs cleaned", itemType: "checkbox", isRequired: true, sortOrder: 2 },
          { id: "item-210", sectionId: "sec-53", name: "Mirrors cleaned", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-211", sectionId: "sec-53", name: "Bathroom notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-54",
        templateId: "tpl-10",
        name: "Exterior / Trash",
        sortOrder: 4,
        items: [
          { id: "item-212", sectionId: "sec-54", name: "Trash removed", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-213", sectionId: "sec-54", name: "Entry swept", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-214", sectionId: "sec-54", name: "Garage cleaned", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-215", sectionId: "sec-54", name: "Exterior notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-11",
    name: "Risk Assessment",
    description: "Safety and risk checklist",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 91,
    lastModified: "Jan 09, 2026",
    sections: [
      {
        id: "sec-14",
        templateId: "tpl-11",
        name: "Safety",
        sortOrder: 1,
        items: [
          { id: "item-216", sectionId: "sec-14", name: "Trip hazards present", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-217", sectionId: "sec-14", name: "Fire exits clear", itemType: "checkbox", isRequired: true, sortOrder: 2 },
          { id: "item-218", sectionId: "sec-14", name: "Handrails secure", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-219", sectionId: "sec-14", name: "Safety notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-55",
        templateId: "tpl-11",
        name: "Environmental",
        sortOrder: 2,
        items: [
          { id: "item-220", sectionId: "sec-55", name: "Mold observed", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-221", sectionId: "sec-55", name: "Water intrusion", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-222", sectionId: "sec-55", name: "Asbestos suspected", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-223", sectionId: "sec-55", name: "Environmental notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-56",
        templateId: "tpl-11",
        name: "Security",
        sortOrder: 3,
        items: [
          { id: "item-224", sectionId: "sec-56", name: "Exterior doors lock", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-225", sectionId: "sec-56", name: "Windows lock", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-226", sectionId: "sec-56", name: "Alarm system present", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-227", sectionId: "sec-56", name: "Security notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-12",
    name: "Fire & Safety Inspection",
    description: "Fire systems and safety compliance",
    type: "inspection",
    standard: "NFPA",
    isDefault: false,
    usageCount: 58,
    lastModified: "Jan 03, 2026",
    sections: [
      {
        id: "sec-15",
        templateId: "tpl-12",
        name: "Fire Systems",
        sortOrder: 1,
        items: [
          { id: "item-228", sectionId: "sec-15", name: "Smoke alarms", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-229", sectionId: "sec-15", name: "Extinguishers present", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-230", sectionId: "sec-15", name: "Sprinkler system", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-231", sectionId: "sec-15", name: "Fire system notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-57",
        templateId: "tpl-12",
        name: "Egress",
        sortOrder: 2,
        items: [
          { id: "item-232", sectionId: "sec-57", name: "Exit signage", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-233", sectionId: "sec-57", name: "Exit lighting", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-234", sectionId: "sec-57", name: "Exits unobstructed", itemType: "checkbox", isRequired: true, sortOrder: 3 },
          { id: "item-235", sectionId: "sec-57", name: "Egress notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-58",
        templateId: "tpl-12",
        name: "Electrical Safety",
        sortOrder: 3,
        items: [
          { id: "item-236", sectionId: "sec-58", name: "Exposed wiring", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-237", sectionId: "sec-58", name: "Overloaded outlets", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-238", sectionId: "sec-58", name: "Electrical safety notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-13",
    name: "Property Listing Details / Features",
    description: "Feature checklist for listings",
    type: "report",
    standard: "Custom",
    isDefault: false,
    usageCount: 72,
    lastModified: "Dec 29, 2025",
    sections: [
      {
        id: "sec-16",
        templateId: "tpl-13",
        name: "Features",
        sortOrder: 1,
        items: [
          { id: "item-239", sectionId: "sec-16", name: "Pool", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-240", sectionId: "sec-16", name: "Updated kitchen", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-241", sectionId: "sec-16", name: "Fireplace", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-242", sectionId: "sec-16", name: "Solar panels", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-243", sectionId: "sec-16", name: "Feature notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-59",
        templateId: "tpl-13",
        name: "Interior Highlights",
        sortOrder: 2,
        items: [
          { id: "item-244", sectionId: "sec-59", name: "Flooring type", itemType: "select", options: ["Hardwood","Tile","Carpet","Laminate","Other"], isRequired: false, sortOrder: 1 },
          { id: "item-245", sectionId: "sec-59", name: "Kitchen appliances included", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-246", sectionId: "sec-59", name: "Smart home features", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-247", sectionId: "sec-59", name: "Interior notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-60",
        templateId: "tpl-13",
        name: "Exterior Highlights",
        sortOrder: 3,
        items: [
          { id: "item-248", sectionId: "sec-60", name: "Roof age (years)", itemType: "number", isRequired: false, sortOrder: 1 },
          { id: "item-249", sectionId: "sec-60", name: "Yard condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-250", sectionId: "sec-60", name: "Garage spaces", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-251", sectionId: "sec-60", name: "Exterior notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-61",
        templateId: "tpl-13",
        name: "Utilities",
        sortOrder: 4,
        items: [
          { id: "item-252", sectionId: "sec-61", name: "Heating type", itemType: "select", options: ["Gas","Electric","Heat pump","Other"], isRequired: false, sortOrder: 1 },
          { id: "item-253", sectionId: "sec-61", name: "Cooling type", itemType: "select", options: ["Central","Mini-split","Window","None"], isRequired: false, sortOrder: 2 },
          { id: "item-254", sectionId: "sec-61", name: "Utility notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-14",
    name: "Smoke / Carbon Monoxide Checks",
    description: "Safety checks for smoke and CO detectors",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 39,
    lastModified: "Jan 11, 2026",
    sections: [
      {
        id: "sec-17",
        templateId: "tpl-14",
        name: "Detectors",
        sortOrder: 1,
        items: [
          { id: "item-255", sectionId: "sec-17", name: "Smoke detector present", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-256", sectionId: "sec-17", name: "CO detector present", itemType: "checkbox", isRequired: true, sortOrder: 2 },
          { id: "item-257", sectionId: "sec-17", name: "Tested and working", itemType: "checkbox", isRequired: true, sortOrder: 3 },
          { id: "item-258", sectionId: "sec-17", name: "Detector locations", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-62",
        templateId: "tpl-14",
        name: "Documentation",
        sortOrder: 2,
        items: [
          { id: "item-259", sectionId: "sec-62", name: "Detector photos", itemType: "photo", isRequired: false, sortOrder: 1 },
          { id: "item-260", sectionId: "sec-62", name: "Replacement recommended", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-261", sectionId: "sec-62", name: "Notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-16",
    name: "Radon Test",
    description: "Short-term radon testing and results documentation",
    type: "inspection",
    standard: "EPA",
    isDefault: false,
    usageCount: 52,
    lastModified: "Jan 13, 2026",
    sections: [
      {
        id: "sec-73",
        templateId: "tpl-16",
        name: "Test Setup",
        sortOrder: 1,
        items: [
          { id: "item-321", sectionId: "sec-73", name: "Device serial number", itemType: "text", isRequired: true, sortOrder: 1 },
          { id: "item-322", sectionId: "sec-73", name: "Placement location", itemType: "text", isRequired: true, sortOrder: 2 },
          { id: "item-323", sectionId: "sec-73", name: "Test start date/time", itemType: "text", isRequired: true, sortOrder: 3 },
          { id: "item-324", sectionId: "sec-73", name: "Test end date/time", itemType: "text", isRequired: true, sortOrder: 4 },
          { id: "item-325", sectionId: "sec-73", name: "Weather conditions", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-74",
        templateId: "tpl-16",
        name: "Results",
        sortOrder: 2,
        items: [
          { id: "item-326", sectionId: "sec-74", name: "Average pCi/L", itemType: "number", isRequired: true, sortOrder: 1 },
          { id: "item-327", sectionId: "sec-74", name: "EPA action level exceeded", itemType: "checkbox", isRequired: true, sortOrder: 2 },
          { id: "item-328", sectionId: "sec-74", name: "Mitigation recommended", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-329", sectionId: "sec-74", name: "Lab report upload", itemType: "photo", isRequired: false, sortOrder: 4 },
          { id: "item-330", sectionId: "sec-74", name: "Result notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
    ],
  },
  {
    id: "tpl-17",
    name: "Mold Inspection",
    description: "Moisture assessment and mold sampling checklist",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 61,
    lastModified: "Jan 14, 2026",
    sections: [
      {
        id: "sec-75",
        templateId: "tpl-17",
        name: "Moisture Assessment",
        sortOrder: 1,
        items: [
          { id: "item-331", sectionId: "sec-75", name: "Visible mold observed", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-332", sectionId: "sec-75", name: "Moisture meter reading (%)", itemType: "number", isRequired: false, sortOrder: 2 },
          { id: "item-333", sectionId: "sec-75", name: "Indoor humidity (%)", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-334", sectionId: "sec-75", name: "Affected areas", itemType: "text", isRequired: false, sortOrder: 4 },
          { id: "item-335", sectionId: "sec-75", name: "Moisture photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-76",
        templateId: "tpl-17",
        name: "Sampling",
        sortOrder: 2,
        items: [
          { id: "item-336", sectionId: "sec-76", name: "Air sample collected", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-337", sectionId: "sec-76", name: "Surface sample collected", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-338", sectionId: "sec-76", name: "Sample location(s)", itemType: "text", isRequired: false, sortOrder: 3 },
          { id: "item-339", sectionId: "sec-76", name: "Lab report upload", itemType: "photo", isRequired: false, sortOrder: 4 },
          { id: "item-340", sectionId: "sec-76", name: "Sampling notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-77",
        templateId: "tpl-17",
        name: "Recommendations",
        sortOrder: 3,
        items: [
          { id: "item-341", sectionId: "sec-77", name: "Remediation recommended", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-342", sectionId: "sec-77", name: "Immediate health concerns", itemType: "text", isRequired: false, sortOrder: 2 },
          { id: "item-343", sectionId: "sec-77", name: "Follow-up testing recommended", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-344", sectionId: "sec-77", name: "Inspector notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-18",
    name: "Termite Inspection",
    description: "Wood-destroying organism inspection checklist",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 74,
    lastModified: "Jan 10, 2026",
    sections: [
      {
        id: "sec-78",
        templateId: "tpl-18",
        name: "Wood-Destroying Organisms",
        sortOrder: 1,
        items: [
          { id: "item-345", sectionId: "sec-78", name: "Evidence of termites", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-346", sectionId: "sec-78", name: "Mud tubes observed", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-347", sectionId: "sec-78", name: "Wood moisture reading (%)", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-348", sectionId: "sec-78", name: "Affected locations", itemType: "text", isRequired: false, sortOrder: 4 },
          { id: "item-349", sectionId: "sec-78", name: "Activity photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-79",
        templateId: "tpl-18",
        name: "Damage & Risk",
        sortOrder: 2,
        items: [
          { id: "item-350", sectionId: "sec-79", name: "Active infestation", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-351", sectionId: "sec-79", name: "Conducive conditions present", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          {
            id: "item-352",
            sectionId: "sec-79",
            name: "Damage severity",
            itemType: "select",
            options: ["None","Minor","Moderate","Severe"],
            isRequired: false,
            sortOrder: 3,
          },
          { id: "item-353", sectionId: "sec-79", name: "Recommended treatment", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-80",
        templateId: "tpl-18",
        name: "Documentation",
        sortOrder: 3,
        items: [
          { id: "item-354", sectionId: "sec-80", name: "Inspection diagram", itemType: "photo", isRequired: false, sortOrder: 1 },
          { id: "item-355", sectionId: "sec-80", name: "Inspector notes", itemType: "text", isRequired: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: "tpl-19",
    name: "Pool/Spa Inspection",
    description: "Pool and spa equipment and safety checklist",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 42,
    lastModified: "Jan 09, 2026",
    sections: [
      {
        id: "sec-81",
        templateId: "tpl-19",
        name: "Equipment",
        sortOrder: 1,
        items: [
          { id: "item-356", sectionId: "sec-81", name: "Pump operational", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-357", sectionId: "sec-81", name: "Filter condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-358", sectionId: "sec-81", name: "Heater operation", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-359", sectionId: "sec-81", name: "Visible leaks", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-360", sectionId: "sec-81", name: "Equipment notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-82",
        templateId: "tpl-19",
        name: "Safety",
        sortOrder: 2,
        items: [
          { id: "item-361", sectionId: "sec-82", name: "Barrier/fencing present", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-362", sectionId: "sec-82", name: "Self-closing gate", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-363", sectionId: "sec-82", name: "Drain covers secure", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-364", sectionId: "sec-82", name: "Safety notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-83",
        templateId: "tpl-19",
        name: "Structure & Water",
        sortOrder: 3,
        items: [
          { id: "item-365", sectionId: "sec-83", name: "Surface condition", itemType: "rating", isRequired: false, sortOrder: 1 },
          { id: "item-366", sectionId: "sec-83", name: "Water clarity", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-367", sectionId: "sec-83", name: "Chemical balance notes", itemType: "text", isRequired: false, sortOrder: 3 },
          { id: "item-368", sectionId: "sec-83", name: "Pool/spa photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-20",
    name: "Sewer Scope",
    description: "Camera inspection of sewer lateral",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 38,
    lastModified: "Jan 08, 2026",
    sections: [
      {
        id: "sec-84",
        templateId: "tpl-20",
        name: "Access & Setup",
        sortOrder: 1,
        items: [
          { id: "item-369", sectionId: "sec-84", name: "Cleanout accessible", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-370", sectionId: "sec-84", name: "Line material", itemType: "select", options: ["PVC","Cast iron","Clay","ABS","Other"], isRequired: false, sortOrder: 2 },
          { id: "item-371", sectionId: "sec-84", name: "Pipe diameter (in)", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-372", sectionId: "sec-84", name: "Video saved", itemType: "checkbox", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-85",
        templateId: "tpl-20",
        name: "Line Condition",
        sortOrder: 2,
        items: [
          { id: "item-373", sectionId: "sec-85", name: "Root intrusion", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-374", sectionId: "sec-85", name: "Offsets/cracks", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-375", sectionId: "sec-85", name: "Sagging/belly observed", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-376", sectionId: "sec-85", name: "Obstructions", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-86",
        templateId: "tpl-20",
        name: "Results",
        sortOrder: 3,
        items: [
          { id: "item-377", sectionId: "sec-86", name: "Recommended repairs", itemType: "text", isRequired: false, sortOrder: 1 },
          { id: "item-378", sectionId: "sec-86", name: "Repair priority", itemType: "select", options: ["Immediate","Soon","Monitor"], isRequired: false, sortOrder: 2 },
          { id: "item-379", sectionId: "sec-86", name: "Inspector notes", itemType: "text", isRequired: false, sortOrder: 3 },
          { id: "item-380", sectionId: "sec-86", name: "Video/photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
  {
    id: "tpl-21",
    name: "4-Point Inspection",
    description: "Insurance-required inspection of roof, HVAC, electrical, and plumbing",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 118,
    lastModified: "Jan 12, 2026",
    sections: [
      {
        id: "sec-87",
        templateId: "tpl-21",
        name: "Roof",
        sortOrder: 1,
        items: [
          { id: "item-381", sectionId: "sec-87", name: "Roof covering condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-382", sectionId: "sec-87", name: "Roof age (years)", itemType: "number", isRequired: false, sortOrder: 2 },
          { id: "item-383", sectionId: "sec-87", name: "Active leaks", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-384", sectionId: "sec-87", name: "Roof photos", itemType: "photo", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-88",
        templateId: "tpl-21",
        name: "HVAC",
        sortOrder: 2,
        items: [
          { id: "item-385", sectionId: "sec-88", name: "System operational", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-386", sectionId: "sec-88", name: "System age (years)", itemType: "number", isRequired: false, sortOrder: 2 },
          { id: "item-387", sectionId: "sec-88", name: "HVAC notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-89",
        templateId: "tpl-21",
        name: "Electrical",
        sortOrder: 3,
        items: [
          { id: "item-388", sectionId: "sec-89", name: "Main panel condition", itemType: "rating", isRequired: true, sortOrder: 1 },
          { id: "item-389", sectionId: "sec-89", name: "Hazards observed", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-390", sectionId: "sec-89", name: "Electrical photos", itemType: "photo", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-90",
        templateId: "tpl-21",
        name: "Plumbing",
        sortOrder: 4,
        items: [
          { id: "item-391", sectionId: "sec-90", name: "Visible leaks", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-392", sectionId: "sec-90", name: "Water heater condition", itemType: "rating", isRequired: false, sortOrder: 2 },
          { id: "item-393", sectionId: "sec-90", name: "Plumbing notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-91",
        templateId: "tpl-21",
        name: "Summary",
        sortOrder: 5,
        items: [
          { id: "item-394", sectionId: "sec-91", name: "Overall condition", itemType: "select", options: ["Good","Fair","Poor"], isRequired: true, sortOrder: 1 },
          { id: "item-395", sectionId: "sec-91", name: "Major issues", itemType: "text", isRequired: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: "tpl-22",
    name: "Wind Mitigation Inspection",
    description: "Wind mitigation checklist for insurance discounts",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 96,
    lastModified: "Jan 11, 2026",
    sections: [
      {
        id: "sec-92",
        templateId: "tpl-22",
        name: "Roof Covering",
        sortOrder: 1,
        items: [
          { id: "item-396", sectionId: "sec-92", name: "Roof shape", itemType: "select", options: ["Gable","Hip","Flat","Other"], isRequired: true, sortOrder: 1 },
          { id: "item-397", sectionId: "sec-92", name: "Covering type", itemType: "select", options: ["Shingle","Metal","Tile","Other"], isRequired: false, sortOrder: 2 },
          { id: "item-398", sectionId: "sec-92", name: "Secondary water barrier", itemType: "checkbox", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-93",
        templateId: "tpl-22",
        name: "Roof Deck Attachment",
        sortOrder: 2,
        items: [
          {
            id: "item-399",
            sectionId: "sec-93",
            name: "Deck attachment type",
            itemType: "select",
            options: ["Toe nails","8d nails","8d nails (ring shank)","Other"],
            isRequired: false,
            sortOrder: 1,
          },
          { id: "item-400", sectionId: "sec-93", name: "Attachment spacing", itemType: "text", isRequired: false, sortOrder: 2 },
        ],
      },
      {
        id: "sec-94",
        templateId: "tpl-22",
        name: "Roof-to-Wall Connection",
        sortOrder: 3,
        items: [
          {
            id: "item-401",
            sectionId: "sec-94",
            name: "Connection type",
            itemType: "select",
            options: ["Toe nails","Clips","Single wrap","Double wrap"],
            isRequired: true,
            sortOrder: 1,
          },
          { id: "item-402", sectionId: "sec-94", name: "Connection notes", itemType: "text", isRequired: false, sortOrder: 2 },
        ],
      },
      {
        id: "sec-95",
        templateId: "tpl-22",
        name: "Opening Protection",
        sortOrder: 4,
        items: [
          { id: "item-403", sectionId: "sec-95", name: "Impact-rated windows", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-404", sectionId: "sec-95", name: "Hurricane shutters", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-405", sectionId: "sec-95", name: "Garage door rated", itemType: "checkbox", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-96",
        templateId: "tpl-22",
        name: "Documentation",
        sortOrder: 5,
        items: [
          { id: "item-406", sectionId: "sec-96", name: "Photo documentation", itemType: "photo", isRequired: false, sortOrder: 1 },
          { id: "item-407", sectionId: "sec-96", name: "Inspector notes", itemType: "text", isRequired: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: "tpl-23",
    name: "Well Water Testing",
    description: "Water quality testing and lab results",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 33,
    lastModified: "Jan 07, 2026",
    sections: [
      {
        id: "sec-97",
        templateId: "tpl-23",
        name: "Sample Collection",
        sortOrder: 1,
        items: [
          { id: "item-408", sectionId: "sec-97", name: "Sample date/time", itemType: "text", isRequired: true, sortOrder: 1 },
          { id: "item-409", sectionId: "sec-97", name: "Sample location", itemType: "text", isRequired: true, sortOrder: 2 },
          { id: "item-410", sectionId: "sec-97", name: "Chain of custody completed", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-411", sectionId: "sec-97", name: "Sample notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-98",
        templateId: "tpl-23",
        name: "Lab Results",
        sortOrder: 2,
        items: [
          { id: "item-412", sectionId: "sec-98", name: "Coliform bacteria present", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-413", sectionId: "sec-98", name: "Nitrates (mg/L)", itemType: "number", isRequired: false, sortOrder: 2 },
          { id: "item-414", sectionId: "sec-98", name: "pH level", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-415", sectionId: "sec-98", name: "Iron (mg/L)", itemType: "number", isRequired: false, sortOrder: 4 },
          { id: "item-416", sectionId: "sec-98", name: "Lab report upload", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-99",
        templateId: "tpl-23",
        name: "Recommendations",
        sortOrder: 3,
        items: [
          { id: "item-417", sectionId: "sec-99", name: "Treatment recommended", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-418", sectionId: "sec-99", name: "Follow-up testing", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-419", sectionId: "sec-99", name: "Inspector notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-24",
    name: "Septic System Inspection",
    description: "Septic system evaluation checklist",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 27,
    lastModified: "Jan 06, 2026",
    sections: [
      {
        id: "sec-100",
        templateId: "tpl-24",
        name: "Tank & Access",
        sortOrder: 1,
        items: [
          { id: "item-420", sectionId: "sec-100", name: "Tank located", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-421", sectionId: "sec-100", name: "Lids accessible", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-422", sectionId: "sec-100", name: "Liquid level (in)", itemType: "number", isRequired: false, sortOrder: 3 },
          { id: "item-423", sectionId: "sec-100", name: "Baffle condition", itemType: "rating", isRequired: false, sortOrder: 4 },
          { id: "item-424", sectionId: "sec-100", name: "Tank notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-101",
        templateId: "tpl-24",
        name: "Distribution",
        sortOrder: 2,
        items: [
          { id: "item-425", sectionId: "sec-101", name: "Pump present", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-426", sectionId: "sec-101", name: "Pump operational", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-427", sectionId: "sec-101", name: "Alarm functional", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-428", sectionId: "sec-101", name: "Distribution box condition", itemType: "rating", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-102",
        templateId: "tpl-24",
        name: "Drain Field",
        sortOrder: 3,
        items: [
          { id: "item-429", sectionId: "sec-102", name: "Surface ponding", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-430", sectionId: "sec-102", name: "Odors present", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-431", sectionId: "sec-102", name: "Vegetation issues", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-432", sectionId: "sec-102", name: "Drain field notes", itemType: "text", isRequired: false, sortOrder: 4 },
          { id: "item-433", sectionId: "sec-102", name: "Drain field photos", itemType: "photo", isRequired: false, sortOrder: 5 },
        ],
      },
    ],
  },
  {
    id: "tpl-25",
    name: "Infrared Thermal Imaging",
    description: "Thermal imaging scan and diagnostics",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 49,
    lastModified: "Jan 05, 2026",
    sections: [
      {
        id: "sec-103",
        templateId: "tpl-25",
        name: "Scan Areas",
        sortOrder: 1,
        items: [
          { id: "item-434", sectionId: "sec-103", name: "Areas scanned", itemType: "text", isRequired: true, sortOrder: 1 },
          { id: "item-435", sectionId: "sec-103", name: "Temperature delta (°F)", itemType: "number", isRequired: false, sortOrder: 2 },
          { id: "item-436", sectionId: "sec-103", name: "Thermal notes", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-104",
        templateId: "tpl-25",
        name: "Thermal Findings",
        sortOrder: 2,
        items: [
          { id: "item-437", sectionId: "sec-104", name: "Anomalies detected", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-438", sectionId: "sec-104", name: "Moisture intrusion suspected", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-439", sectionId: "sec-104", name: "Electrical hotspots observed", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-440", sectionId: "sec-104", name: "Recommended follow-up", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-105",
        templateId: "tpl-25",
        name: "Documentation",
        sortOrder: 3,
        items: [
          { id: "item-441", sectionId: "sec-105", name: "Thermal images", itemType: "photo", isRequired: false, sortOrder: 1 },
          { id: "item-442", sectionId: "sec-105", name: "Inspector notes", itemType: "text", isRequired: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: "tpl-26",
    name: "11th Month Warranty Inspection",
    description: "Builder warranty inspection before expiration",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 68,
    lastModified: "Jan 04, 2026",
    sections: [
      {
        id: "sec-106",
        templateId: "tpl-26",
        name: "Structure",
        sortOrder: 1,
        items: [
          { id: "item-443", sectionId: "sec-106", name: "Foundation cracks", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-444", sectionId: "sec-106", name: "Framing issues", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-445", sectionId: "sec-106", name: "Settlement signs", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-446", sectionId: "sec-106", name: "Structure notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-107",
        templateId: "tpl-26",
        name: "Systems",
        sortOrder: 2,
        items: [
          { id: "item-447", sectionId: "sec-107", name: "HVAC performance issues", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-448", sectionId: "sec-107", name: "Plumbing defects", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-449", sectionId: "sec-107", name: "Electrical defects", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-450", sectionId: "sec-107", name: "Systems notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-108",
        templateId: "tpl-26",
        name: "Interior / Exterior",
        sortOrder: 3,
        items: [
          { id: "item-451", sectionId: "sec-108", name: "Interior defects", itemType: "text", isRequired: false, sortOrder: 1 },
          { id: "item-452", sectionId: "sec-108", name: "Exterior defects", itemType: "text", isRequired: false, sortOrder: 2 },
          { id: "item-453", sectionId: "sec-108", name: "Photos", itemType: "photo", isRequired: false, sortOrder: 3 },
        ],
      },
      {
        id: "sec-109",
        templateId: "tpl-26",
        name: "Punch List",
        sortOrder: 4,
        items: [
          { id: "item-454", sectionId: "sec-109", name: "Defect summary", itemType: "text", isRequired: false, sortOrder: 1 },
          { id: "item-455", sectionId: "sec-109", name: "Priority items", itemType: "text", isRequired: false, sortOrder: 2 },
          { id: "item-456", sectionId: "sec-109", name: "Recommended actions", itemType: "text", isRequired: false, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-15",
    name: "HMO Fire & Safety / Property Audit",
    description: "Audit checklist for HMO safety compliance",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 24,
    lastModified: "Jan 07, 2026",
    sections: [
      {
        id: "sec-18",
        templateId: "tpl-15",
        name: "Compliance",
        sortOrder: 1,
        items: [
          { id: "item-262", sectionId: "sec-18", name: "Fire doors installed", itemType: "checkbox", isRequired: true, sortOrder: 1 },
          { id: "item-263", sectionId: "sec-18", name: "Emergency lighting", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-264", sectionId: "sec-18", name: "Fire alarm panel", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-265", sectionId: "sec-18", name: "Extinguishers serviced", itemType: "checkbox", isRequired: false, sortOrder: 4 },
          { id: "item-266", sectionId: "sec-18", name: "Compliance notes", itemType: "text", isRequired: false, sortOrder: 5 },
        ],
      },
      {
        id: "sec-63",
        templateId: "tpl-15",
        name: "Common Areas",
        sortOrder: 2,
        items: [
          { id: "item-267", sectionId: "sec-63", name: "Hallways clear", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-268", sectionId: "sec-63", name: "Emergency exits clear", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-269", sectionId: "sec-63", name: "Lighting condition", itemType: "rating", isRequired: false, sortOrder: 3 },
          { id: "item-270", sectionId: "sec-63", name: "Common area notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
      {
        id: "sec-64",
        templateId: "tpl-15",
        name: "Tenant Units",
        sortOrder: 3,
        items: [
          { id: "item-271", sectionId: "sec-64", name: "Fire doors close properly", itemType: "checkbox", isRequired: false, sortOrder: 1 },
          { id: "item-272", sectionId: "sec-64", name: "Smoke alarms tested", itemType: "checkbox", isRequired: false, sortOrder: 2 },
          { id: "item-273", sectionId: "sec-64", name: "CO alarms tested", itemType: "checkbox", isRequired: false, sortOrder: 3 },
          { id: "item-274", sectionId: "sec-64", name: "Unit notes", itemType: "text", isRequired: false, sortOrder: 4 },
        ],
      },
    ],
  },
];

export function getTemplates() {
  return templates.map((template) => applyTemplatePricing(template));
}

export function getTemplateById(id: string) {
  const template = templates.find((item) => item.id === id);
  return template ? applyTemplatePricing(template) : null;
}

export function updateTemplateById(id: string, data: Partial<Template>) {
  const idx = templates.findIndex((template) => template.id === id);
  if (idx === -1) return null;
  templates[idx] = {
    ...templates[idx],
    ...data,
    lastModified: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
  };
  return applyTemplatePricing(templates[idx]);
}

type MergeStrategy = "append" | "mergeByName";

const cloneSection = (section: TemplateSection, templateId: string): TemplateSection => {
  const nextSectionId = `sec-${generateReadableId()}`;
  return {
    ...section,
    id: nextSectionId,
    templateId,
    items: section.items.map((item, index) => ({
      ...item,
      id: `item-${generateReadableId()}`,
      sectionId: nextSectionId,
      sortOrder: index + 1,
    })),
  };
};

const combineTemplateSections = (
  sourceTemplates: Template[],
  templateId: string,
  mergeStrategy: MergeStrategy
): TemplateSection[] => {
  const combined: TemplateSection[] = [];

  sourceTemplates.forEach((template) => {
    template.sections.forEach((section) => {
      if (mergeStrategy === "mergeByName") {
        const existing = combined.find((entry) => entry.name.toLowerCase() === section.name.toLowerCase());
        if (existing) {
          const appendedItems = section.items.map((item, index) => ({
            ...item,
            id: `item-${generateReadableId()}`,
            sectionId: existing.id,
            sortOrder: existing.items.length + index + 1,
          }));
          existing.items = [...existing.items, ...appendedItems];
          return;
        }
      }

      combined.push(cloneSection(section, templateId));
    });
  });

  return combined.map((section, index) => ({
    ...section,
    sortOrder: index + 1,
    items: section.items.map((item, itemIndex) => ({
      ...item,
      sortOrder: itemIndex + 1,
    })),
  }));
};

export function createCombinedTemplate(
  baseTemplateId: string,
  addonTemplateIds: string[],
  mergeStrategy: MergeStrategy = "append"
) {
  const baseTemplate = getTemplateById(baseTemplateId);
  if (!baseTemplate) return null;

  const addons = addonTemplateIds
    .map((id) => getTemplateById(id))
    .filter((template): template is Template => !!template);

  const combinedId = `tpl-${generateReadableId()}`;
  const addonNames = addons.map((addon) => addon.name);
  const combinedName = [baseTemplate.name, ...addonNames].join(" + ");
  const combinedPrice = [baseTemplate, ...addons].reduce(
    (sum, template) => sum + (template.basePrice ?? 0),
    0
  );

  return {
    ...baseTemplate,
    id: combinedId,
    name: combinedName,
    description: addonNames.length
      ? `${baseTemplate.description ?? ""} Includes: ${addonNames.join(", ")}.`
      : baseTemplate.description,
    isDefault: false,
    isAddon: false,
    usageCount: 0,
    lastModified: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    basePrice: combinedPrice,
    sections: combineTemplateSections([baseTemplate, ...addons], combinedId, mergeStrategy),
  };
}

export function duplicateTemplate(id: string) {
  const template = getTemplateById(id);
  if (!template) return null;
  const nextId = generateReadableId();
  const copy: Template = {
    ...template,
    id: `tpl-${nextId}`,
    name: `${template.name} (Copy)`,
    isDefault: false,
    usageCount: 0,
    lastModified: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    sections: template.sections.map((section) => ({
      ...section,
      id: `sec-${generateReadableId()}`,
      items: section.items.map((item) => ({
        ...item,
        id: `item-${generateReadableId()}`,
      })),
    })),
  };
  templates.unshift(copy);
  return copy;
}

export function createTemplateStub({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  const nextId = generateReadableId();
  const sectionId = `sec-${generateReadableId()}`;
  const templateId = `tpl-${nextId}`;
  const template: Template = {
    id: templateId,
    name,
    description: description || "Auto-created template stub",
    type: "inspection",
    standard: "Custom",
    isDefault: false,
    usageCount: 0,
    lastModified: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    sections: [
      {
        id: sectionId,
        templateId,
        name: "Overview",
        description: "Auto-generated section",
        sortOrder: 1,
        items: [
          {
            id: `item-${generateReadableId()}`,
            sectionId,
            name: "General notes",
            itemType: "text",
            isRequired: false,
            sortOrder: 1,
          },
        ],
      },
    ],
  };

  templates.unshift(template);
  return template;
}
