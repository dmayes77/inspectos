import { generateReadableId } from "@/lib/id-generator";
import { services, SERVICE_IDS } from "@/lib/mock/services";
import { normalizeServiceIds } from "@/lib/utils/services";
import type { Inspection } from "@/types/inspection";
export const inspections: Inspection[] = [
  {
    inspectionId: "G6P7-R8T9",
    address: "123 Oak Street, Austin TX 78701",
    client: "John Smith",
    clientId: "A3G7-K9M2",
    inspector: "Mike Richardson",
    inspectorId: "ACM-3001",
    date: "2026-01-10",
    time: "09:00",
    types: [SERVICE_IDS.fullHome],
    status: "in_progress",
    price: 425,
    sqft: 2400,
    yearBuilt: 1985,
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 2.5,
    stories: "2",
    foundation: "Slab",
    garage: "2-car",
    pool: false,
    notes: "Client requested extra attention to roof and foundation.",
  },
  {
    inspectionId: "H8Q9-S1V2",
    address: "456 Maple Ave, Austin TX 78702",
    client: "Sarah Chen",
    clientId: "B5H8-L2N4",
    inspector: "Mike Richardson",
    inspectorId: "ACM-3001",
    date: "2026-01-10",
    time: "13:00",
    types: [SERVICE_IDS.preListing],
    status: "scheduled",
    price: 350,
    sqft: 1800,
    yearBuilt: 2005,
    propertyType: "Townhouse",
    bedrooms: 3,
    bathrooms: 2,
    stories: "2",
    foundation: "Pier & Beam",
    garage: "1-car",
    pool: false,
  },
  {
    inspectionId: "J1R2-T3W4",
    address: "789 Cedar Lane, Round Rock TX 78664",
    client: "David Martinez",
    clientId: "C7J9-M3P5",
    inspector: "Mike Richardson",
    inspectorId: "ACM-3001",
    date: "2026-01-10",
    time: "16:00",
    types: [SERVICE_IDS.fullHome],
    status: "scheduled",
    price: 525,
    sqft: 3200,
    yearBuilt: 1992,
    propertyType: "Single Family",
    bedrooms: 5,
    bathrooms: 3,
    stories: "2",
    foundation: "Slab",
    garage: "3-car",
    pool: true,
  },
  {
    inspectionId: "K3S4-V5X6",
    address: "321 Pine Road, Pflugerville TX 78660",
    client: "Emily Wilson",
    clientId: "D9K1-N4Q6",
    inspector: "James Wilson",
    inspectorId: "ACM-3002",
    date: "2026-01-10",
    time: "10:00",
    types: [SERVICE_IDS.fullHome],
    status: "completed",
    price: 425,
    sqft: 2100,
    yearBuilt: 1998,
    propertyType: "Condo",
    bedrooms: 2,
    bathrooms: 2,
    stories: "1",
    foundation: "Slab",
    garage: "None",
    pool: false,
  },
  {
    inspectionId: "M5T6-W7Y8",
    address: "654 Elm Street, Austin TX 78703",
    client: "Michael Brown",
    clientId: "E2M3-P5R7",
    inspector: "James Wilson",
    inspectorId: "ACM-3002",
    date: "2026-01-10",
    time: "14:30",
    types: [SERVICE_IDS.radon],
    status: "scheduled",
    price: 150,
    sqft: 1500,
    yearBuilt: 2010,
    propertyType: "Single Family",
    bedrooms: 3,
    bathrooms: 2,
    stories: "1",
    foundation: "Slab",
    garage: "1-car",
    pool: false,
  },
  {
    inspectionId: "N7V8-X9Z1",
    address: "987 Birch Ave, Austin TX 78704",
    client: "Lisa Anderson",
    clientId: "F4N5-Q6S8",
    inspector: "Mike Richardson",
    inspectorId: "ACM-3001",
    date: "2026-01-09",
    time: "11:00",
    types: [SERVICE_IDS.fullHome],
    status: "pending_report",
    price: 450,
    sqft: 2600,
    yearBuilt: 1978,
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 2,
    stories: "1",
    foundation: "Pier & Beam",
    garage: "2-car",
    pool: true,
  },
];

export function getInspections({ search }: { search?: string } = {}) {
  if (search) {
    const q = search.toLowerCase();
    return inspections.filter((i) => i.address.toLowerCase().includes(q) || i.client.toLowerCase().includes(q));
  }
  return inspections;
}

export function createInspection(data: Partial<Inspection> & { types?: string[]; type?: string }) {
  const inspectionId = generateReadableId();

  const now = new Date();
  const types = normalizeServiceIds(data.types ?? data.type, services);
  if (types.length === 0) {
    types.push(SERVICE_IDS.fullHome);
  }

  const ins: Inspection = {
    inspectionId,
    address: (data.address as string) || "",
    client: (data.client as string) || "",
    clientId: (data.clientId as string) || "",
    inspector: (data.inspector as string) || "",
    inspectorId: (data.inspectorId as string) || "",
    date: (data.date as string) || now.toISOString().slice(0, 10),
    time: (data.time as string) || now.toTimeString().slice(0, 5),
    types,
    status: (data.status as string) || "scheduled",
    price: Number(data.price) || 0,
    sqft: data.sqft,
    yearBuilt: data.yearBuilt,
    propertyType: data.propertyType,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    stories: data.stories,
    foundation: data.foundation,
    garage: data.garage,
    pool: data.pool,
    notes: data.notes,
  };

  inspections.unshift(ins);
  return ins;
}

export function getInspectionById(inspectionId: string) {
  return inspections.find((i) => i.inspectionId === inspectionId) || null;
}

export function updateInspection(inspectionId: string, data: Partial<Inspection>) {
  const idx = inspections.findIndex((i) => i.inspectionId === inspectionId);
  if (idx === -1) return null;
  inspections[idx] = { ...inspections[idx], ...data };
  return inspections[idx];
}

export function deleteInspection(inspectionId: string) {
  const idx = inspections.findIndex((i) => i.inspectionId === inspectionId);
  if (idx === -1) return false;
  inspections.splice(idx, 1);
  return true;
}

export const addInspection = createInspection;
