// src/lib/mock/clients.ts
import { generateReadableId } from "@/lib/id-generator";

export type Client = {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  type: "Homebuyer" | "Real Estate Agent" | "Seller" | string;
  inspections: number;
  lastInspection: string;
  totalSpent: number;
  archived?: boolean;
};

export const clients: Client[] = [
  {
    clientId: "A3G7-K9M2", // John Smith
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "(512) 555-1234",
    type: "Homebuyer",
    inspections: 3,
    lastInspection: "Jan 10, 2026",
    totalSpent: 1275,
    archived: false,
  },
  {
    clientId: "B5H8-L2N4", // Sarah Chen
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "(512) 555-2345",
    type: "Homebuyer",
    inspections: 1,
    lastInspection: "Jan 10, 2026",
    totalSpent: 350,
    archived: false,
  },
  {
    clientId: "C7J9-M3P5", // David Martinez
    name: "David Martinez",
    email: "david.m@email.com",
    phone: "(512) 555-3456",
    type: "Homebuyer",
    inspections: 2,
    lastInspection: "Jan 10, 2026",
    totalSpent: 875,
    archived: false,
  },
  {
    clientId: "D9K1-N4Q6", // Emily Wilson
    name: "Emily Wilson",
    email: "emily.w@email.com",
    phone: "(512) 555-4567",
    type: "Real Estate Agent",
    inspections: 12,
    lastInspection: "Jan 9, 2026",
    totalSpent: 4850,
    archived: false,
  },
  {
    clientId: "E2M3-P5R7", // Michael Brown
    name: "Michael Brown",
    email: "m.brown@email.com",
    phone: "(512) 555-5678",
    type: "Homebuyer",
    inspections: 1,
    lastInspection: "Jan 10, 2026",
    totalSpent: 150,
    archived: false,
  },
  {
    clientId: "F4N5-Q6S8", // Lisa Anderson
    name: "Lisa Anderson",
    email: "lisa.a@remax.com",
    phone: "(512) 555-6789",
    type: "Real Estate Agent",
    inspections: 28,
    lastInspection: "Jan 9, 2026",
    totalSpent: 11200,
    archived: false,
  },
];

// CRUD operations
export function getClients(includeArchived = false): Client[] {
  return includeArchived ? clients : clients.filter((c) => !c.archived);
}

export function addClient(client: Omit<Client, "clientId" | "archived">): Client {
  const newClient: Client = {
    ...client,
    clientId: generateReadableId(),
    archived: false,
  };
  clients.push(newClient);
  return newClient;
}

export function updateClient(clientId: string, updates: Partial<Client>): Client | null {
  const idx = clients.findIndex((c) => c.clientId === clientId);
  if (idx === -1) return null;
  clients[idx] = { ...clients[idx], ...updates };
  return clients[idx];
}

export function archiveClient(clientId: string): boolean {
  const idx = clients.findIndex((c) => c.clientId === clientId);
  if (idx === -1) return false;
  clients[idx].archived = true;
  return true;
}

export function restoreClient(clientId: string): boolean {
  const idx = clients.findIndex((c) => c.clientId === clientId);
  if (idx === -1) return false;
  clients[idx].archived = false;
  return true;
}

export function deleteClient(clientId: string): boolean {
  const idx = clients.findIndex((c) => c.clientId === clientId);
  if (idx === -1) return false;
  clients.splice(idx, 1);
  return true;
}

export function getClientById(clientId: string): Client | null {
  return clients.find((c) => c.clientId === clientId) || null;
}
