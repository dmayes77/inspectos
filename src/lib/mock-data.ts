/**
 * Mock data for InspectOS inspector app
 * Based on the database schema from system overview
 */

// =============================================================================
// TYPES
// =============================================================================

export type InspectionStatus = "scheduled" | "in_progress" | "completed" | "canceled";
export type ItemStatus = "not_inspected" | "good" | "fair" | "poor" | "not_present";
export type DefectSeverity = "safety" | "major" | "minor" | "maintenance";
export type RoomStatus = "not_started" | "in_progress" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: "inspector" | "admin" | "owner";
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: "single_family" | "townhouse" | "condo" | "multi_family";
  sqft: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  foundation: "slab" | "crawlspace" | "basement" | "pier_beam";
  garage: "none" | "attached" | "detached";
  pool: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Inspection {
  id: string;
  property: Property;
  client: Client;
  inspector: User;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number; // hours
  status: InspectionStatus;
  services: Service[];
  totalPrice: number;
  depositPaid: number;
  notes?: string;
}

export interface Room {
  id: string;
  inspectionId: string;
  name: string;
  type: string;
  order: number;
  status: RoomStatus;
  itemsTotal: number;
  itemsCompleted: number;
  defectsCount: number;
  photosCount: number;
}

export interface InspectionItem {
  id: string;
  roomId: string;
  category: string;
  name: string;
  description?: string;
  status: ItemStatus;
  notes?: string;
  order: number;
}

export interface Defect {
  id: string;
  itemId: string;
  roomId: string;
  severity: DefectSeverity;
  title: string;
  description: string;
  recommendation?: string;
  estimatedCost?: number;
  photos: Photo[];
}

export interface Photo {
  id: string;
  inspectionId: string;
  roomId?: string;
  itemId?: string;
  defectId?: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  annotations?: Annotation[];
  takenAt: Date;
}

export interface Annotation {
  id: string;
  type: "arrow" | "circle" | "rectangle" | "freehand" | "text";
  color: string;
  data: Record<string, unknown>;
}

// =============================================================================
// MOCK DATA
// =============================================================================

export const mockInspector: User = {
  id: "user_001",
  name: "Mike Richardson",
  email: "mike@inspections.com",
  phone: "(512) 555-0100",
  role: "inspector",
};

export const mockClients: Client[] = [
  {
    id: "client_001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "(512) 555-0123",
  },
  {
    id: "client_002",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "(512) 555-0456",
  },
  {
    id: "client_003",
    name: "David Martinez",
    email: "david.martinez@email.com",
    phone: "(512) 555-0789",
  },
];

export const mockProperties: Property[] = [
  {
    id: "prop_001",
    address: "123 Oak Street",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    propertyType: "single_family",
    sqft: 2450,
    yearBuilt: 1985,
    bedrooms: 4,
    bathrooms: 2.5,
    stories: 2,
    foundation: "slab",
    garage: "attached",
    pool: false,
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    id: "prop_002",
    address: "456 Maple Avenue",
    city: "Austin",
    state: "TX",
    zipCode: "78702",
    propertyType: "townhouse",
    sqft: 1800,
    yearBuilt: 2010,
    bedrooms: 3,
    bathrooms: 2,
    stories: 2,
    foundation: "slab",
    garage: "attached",
    pool: false,
    latitude: 30.2599,
    longitude: -97.7247,
  },
  {
    id: "prop_003",
    address: "789 Cedar Lane",
    city: "Round Rock",
    state: "TX",
    zipCode: "78664",
    propertyType: "single_family",
    sqft: 3200,
    yearBuilt: 2018,
    bedrooms: 5,
    bathrooms: 3,
    stories: 2,
    foundation: "slab",
    garage: "attached",
    pool: true,
    latitude: 30.5083,
    longitude: -97.6789,
  },
];

export const mockServices: Service[] = [
  { id: "svc_001", name: "Full Home Inspection", price: 400 },
  { id: "svc_002", name: "Pre-Listing Inspection", price: 350 },
  { id: "svc_003", name: "Radon Testing", price: 150 },
  { id: "svc_004", name: "Mold Inspection", price: 200 },
  { id: "svc_005", name: "Pool/Spa Inspection", price: 125 },
];

export const mockInspections: Inspection[] = [
  {
    id: "insp_001",
    property: mockProperties[0],
    client: mockClients[0],
    inspector: mockInspector,
    scheduledAt: new Date("2026-01-11T09:00:00"),
    estimatedDuration: 3,
    status: "scheduled",
    services: [mockServices[0], mockServices[2]],
    totalPrice: 550,
    depositPaid: 100,
    notes: "Client will meet at property. Dog in backyard - ask before entering.",
  },
  {
    id: "insp_002",
    property: mockProperties[1],
    client: mockClients[1],
    inspector: mockInspector,
    scheduledAt: new Date("2026-01-11T13:00:00"),
    estimatedDuration: 2,
    status: "scheduled",
    services: [mockServices[1]],
    totalPrice: 350,
    depositPaid: 100,
  },
  {
    id: "insp_003",
    property: mockProperties[2],
    client: mockClients[2],
    inspector: mockInspector,
    scheduledAt: new Date("2026-01-11T16:00:00"),
    estimatedDuration: 4,
    status: "scheduled",
    services: [mockServices[0], mockServices[4]],
    totalPrice: 525,
    depositPaid: 100,
    notes: "New construction. Builder will provide access.",
  },
];

// Standard room types for a home inspection
export const standardRoomTypes = [
  { type: "exterior_front", name: "Exterior - Front" },
  { type: "exterior_back", name: "Exterior - Back" },
  { type: "exterior_left", name: "Exterior - Left Side" },
  { type: "exterior_right", name: "Exterior - Right Side" },
  { type: "roof", name: "Roof" },
  { type: "garage", name: "Garage" },
  { type: "living_room", name: "Living Room" },
  { type: "kitchen", name: "Kitchen" },
  { type: "dining_room", name: "Dining Room" },
  { type: "master_bedroom", name: "Master Bedroom" },
  { type: "master_bathroom", name: "Master Bathroom" },
  { type: "bedroom_2", name: "Bedroom 2" },
  { type: "bedroom_3", name: "Bedroom 3" },
  { type: "bedroom_4", name: "Bedroom 4" },
  { type: "bathroom_2", name: "Bathroom 2" },
  { type: "bathroom_3", name: "Bathroom 3" },
  { type: "laundry", name: "Laundry Room" },
  { type: "attic", name: "Attic" },
  { type: "hvac", name: "HVAC System" },
  { type: "electrical", name: "Electrical Panel" },
  { type: "plumbing", name: "Plumbing System" },
  { type: "water_heater", name: "Water Heater" },
];

// Generate rooms for an inspection
export function generateRoomsForInspection(inspectionId: string, property: Property): Room[] {
  const rooms: Room[] = [];
  let order = 0;

  // Always include these
  const baseRooms = [
    "exterior_front",
    "exterior_back",
    "roof",
    "living_room",
    "kitchen",
    "dining_room",
    "master_bedroom",
    "master_bathroom",
    "laundry",
    "attic",
    "hvac",
    "electrical",
    "plumbing",
    "water_heater",
  ];

  // Add based on property
  if (property.garage !== "none") baseRooms.push("garage");
  if (property.bedrooms >= 2) baseRooms.push("bedroom_2");
  if (property.bedrooms >= 3) baseRooms.push("bedroom_3");
  if (property.bedrooms >= 4) baseRooms.push("bedroom_4");
  if (property.bathrooms >= 2) baseRooms.push("bathroom_2");
  if (property.bathrooms >= 3) baseRooms.push("bathroom_3");

  for (const roomType of baseRooms) {
    const roomDef = standardRoomTypes.find(r => r.type === roomType);
    if (roomDef) {
      rooms.push({
        id: `room_${inspectionId}_${order}`,
        inspectionId,
        name: roomDef.name,
        type: roomDef.type,
        order: order++,
        status: "not_started",
        itemsTotal: getItemCountForRoom(roomType),
        itemsCompleted: 0,
        defectsCount: 0,
        photosCount: 0,
      });
    }
  }

  return rooms;
}

function getItemCountForRoom(roomType: string): number {
  const counts: Record<string, number> = {
    exterior_front: 12,
    exterior_back: 10,
    exterior_left: 6,
    exterior_right: 6,
    roof: 15,
    garage: 10,
    living_room: 8,
    kitchen: 18,
    dining_room: 6,
    master_bedroom: 8,
    master_bathroom: 14,
    bedroom_2: 6,
    bedroom_3: 6,
    bedroom_4: 6,
    bathroom_2: 12,
    bathroom_3: 12,
    laundry: 8,
    attic: 10,
    hvac: 12,
    electrical: 10,
    plumbing: 8,
    water_heater: 8,
  };
  return counts[roomType] || 8;
}

// Inspection items by room type
export const inspectionItemsByRoom: Record<string, { category: string; items: string[] }[]> = {
  exterior_front: [
    { category: "Siding/Cladding", items: ["Condition", "Caulking/Seals", "Paint/Finish"] },
    { category: "Windows", items: ["Frames", "Glass", "Screens", "Operation"] },
    { category: "Entry Door", items: ["Door Condition", "Weather Stripping", "Lock/Hardware", "Threshold"] },
    { category: "Porch/Stoop", items: ["Surface Condition", "Railings", "Steps"] },
  ],
  kitchen: [
    { category: "Cabinets", items: ["Upper Cabinets", "Lower Cabinets", "Hardware", "Drawers"] },
    { category: "Countertops", items: ["Surface Condition", "Backsplash", "Caulking"] },
    { category: "Sink", items: ["Basin Condition", "Faucet", "Sprayer", "Drain/P-trap"] },
    { category: "Appliances", items: ["Dishwasher", "Disposal", "Range/Oven", "Range Hood", "Microwave", "Refrigerator"] },
    { category: "Electrical", items: ["GFCI Outlets", "Light Fixtures", "Switches"] },
  ],
  master_bathroom: [
    { category: "Toilet", items: ["Flush Operation", "Tank/Bowl Condition", "Wax Ring Seal", "Supply Line"] },
    { category: "Sink/Vanity", items: ["Basin", "Faucet", "Drain", "Cabinet Condition"] },
    { category: "Shower/Tub", items: ["Enclosure", "Faucet/Valve", "Showerhead", "Drain", "Caulking/Grout"] },
    { category: "Ventilation", items: ["Exhaust Fan", "Window (if present)"] },
    { category: "Electrical", items: ["GFCI Outlets", "Light Fixtures"] },
  ],
  hvac: [
    { category: "Furnace/Air Handler", items: ["Unit Condition", "Filter", "Burners/Heat Exchanger", "Blower Motor"] },
    { category: "AC Condenser", items: ["Unit Condition", "Refrigerant Lines", "Electrical Connections", "Fins/Coils"] },
    { category: "Ductwork", items: ["Visible Ducts", "Connections", "Insulation"] },
    { category: "Thermostat", items: ["Operation", "Programming"] },
  ],
  electrical: [
    { category: "Main Panel", items: ["Panel Condition", "Breakers", "Wiring", "Grounding", "Labeling"] },
    { category: "Sub-Panel", items: ["Panel Condition", "Breakers", "Wiring"] },
    { category: "Service", items: ["Service Entry", "Meter Base", "Service Rating"] },
  ],
  roof: [
    { category: "Covering", items: ["Shingles/Material", "Wear/Damage", "Moss/Debris"] },
    { category: "Flashings", items: ["Valleys", "Penetrations", "Wall Intersections", "Drip Edge"] },
    { category: "Drainage", items: ["Gutters", "Downspouts", "Splash Blocks"] },
    { category: "Structure", items: ["Visible Decking", "Ventilation", "Chimneys"] },
  ],
};

// Get inspection items for a room
export function getInspectionItemsForRoom(room: Room): InspectionItem[] {
  const items: InspectionItem[] = [];
  const roomItems = inspectionItemsByRoom[room.type];

  if (!roomItems) {
    // Generate generic items
    return [
      { id: `item_${room.id}_0`, roomId: room.id, category: "General", name: "Overall Condition", status: "not_inspected", order: 0 },
      { id: `item_${room.id}_1`, roomId: room.id, category: "General", name: "Walls", status: "not_inspected", order: 1 },
      { id: `item_${room.id}_2`, roomId: room.id, category: "General", name: "Ceiling", status: "not_inspected", order: 2 },
      { id: `item_${room.id}_3`, roomId: room.id, category: "General", name: "Floor", status: "not_inspected", order: 3 },
      { id: `item_${room.id}_4`, roomId: room.id, category: "General", name: "Windows", status: "not_inspected", order: 4 },
      { id: `item_${room.id}_5`, roomId: room.id, category: "Electrical", name: "Outlets", status: "not_inspected", order: 5 },
      { id: `item_${room.id}_6`, roomId: room.id, category: "Electrical", name: "Switches", status: "not_inspected", order: 6 },
      { id: `item_${room.id}_7`, roomId: room.id, category: "Electrical", name: "Light Fixtures", status: "not_inspected", order: 7 },
    ];
  }

  let order = 0;
  for (const category of roomItems) {
    for (const itemName of category.items) {
      items.push({
        id: `item_${room.id}_${order}`,
        roomId: room.id,
        category: category.category,
        name: itemName,
        status: "not_inspected",
        order: order++,
      });
    }
  }

  return items;
}

// Sample defects for demo
export const sampleDefects: Omit<Defect, "id" | "itemId" | "roomId" | "photos">[] = [
  {
    severity: "safety",
    title: "Double-tapped breaker",
    description: "Two circuits connected to single breaker. Fire hazard.",
    recommendation: "Have licensed electrician install tandem breaker or add new breaker.",
    estimatedCost: 150,
  },
  {
    severity: "safety",
    title: "Missing GFCI protection",
    description: "Outlets near water source lack ground fault protection.",
    recommendation: "Install GFCI outlets or GFCI breaker for this circuit.",
    estimatedCost: 200,
  },
  {
    severity: "major",
    title: "Active roof leak",
    description: "Water staining on ceiling indicates active leak. Source appears to be damaged flashing.",
    recommendation: "Repair flashing and inspect/replace damaged decking. Check attic for mold.",
    estimatedCost: 800,
  },
  {
    severity: "major",
    title: "HVAC not cooling properly",
    description: "AC unit running but temperature differential only 12 degrees (should be 15-20).",
    recommendation: "Have HVAC technician check refrigerant levels and system performance.",
    estimatedCost: 300,
  },
  {
    severity: "minor",
    title: "Slow drain",
    description: "Bathroom sink drains slowly. Likely partial clog.",
    recommendation: "Clean drain or have plumber snake the line.",
    estimatedCost: 100,
  },
  {
    severity: "maintenance",
    title: "Caulking needed",
    description: "Caulking around tub/shower is cracked and separating.",
    recommendation: "Remove old caulk and apply fresh silicone caulk.",
    estimatedCost: 50,
  },
];

// Helper to get inspection by ID
export function getInspectionById(id: string): Inspection | undefined {
  return mockInspections.find(i => i.id === id);
}

// Helper to get rooms for inspection
export function getRoomsForInspection(inspectionId: string): Room[] {
  const inspection = getInspectionById(inspectionId);
  if (!inspection) return [];
  return generateRoomsForInspection(inspectionId, inspection.property);
}

// Helper to get a specific room
export function getRoomById(inspectionId: string, roomId: string): Room | undefined {
  const rooms = getRoomsForInspection(inspectionId);
  return rooms.find(r => r.id === roomId);
}
