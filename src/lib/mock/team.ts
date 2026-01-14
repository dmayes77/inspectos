import crypto from "crypto";
import { v4 as uuidv4Node } from "uuid";
// Clean, minimal, valid TypeScript mock for team members

export type TeamMember = {
  id: string;
  teamMemberId: string;
  avatarUrl?: string;
  name: string;
  email: string;
  phone: string;
  role: "OWNER" | "ADMIN" | "INSPECTOR" | "OFFICE_STAFF";
  status: "active" | "on_leave" | "inactive";
  location: string;
  inspections: number;
  rating: number | null;
  certifications: string[];
  joinedDate: string;
  customPermissions: string[];
};

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    teamMemberId: "1000000001",
    name: "Sarah Johnson",
    email: "sarah@acmeinspections.com",
    phone: "555-123-4567",
    role: "OWNER",
    status: "active",
    location: "Austin, TX",
    inspections: 12,
    rating: 4.9,
    certifications: ["License #12345"],
    joinedDate: "Jan 2022",
    customPermissions: [],
  },
  {
    id: "2",
    teamMemberId: "1000000002",
    name: "Mike Richardson",
    email: "mike@acmeinspections.com",
    phone: "555-234-5678",
    role: "INSPECTOR",
    status: "active",
    location: "Austin, TX",
    inspections: 8,
    rating: 4.7,
    certifications: ["License #23456"],
    joinedDate: "Feb 2022",
    customPermissions: [],
  },
  {
    id: "3",
    teamMemberId: "1000000003",
    name: "James Wilson",
    email: "james@acmeinspections.com",
    phone: "555-345-6789",
    role: "INSPECTOR",
    status: "active",
    location: "Round Rock, TX",
    inspections: 7,
    rating: 4.8,
    certifications: ["License #34567"],
    joinedDate: "Mar 2022",
    customPermissions: [],
  },
  {
    id: "4",
    teamMemberId: "1000000004",
    name: "David Chen",
    email: "david@acmeinspections.com",
    phone: "555-456-7890",
    role: "INSPECTOR",
    status: "active",
    location: "Austin, TX",
    inspections: 6,
    rating: 4.6,
    certifications: ["License #45678"],
    joinedDate: "Apr 2022",
    customPermissions: [],
  },
  {
    id: "5",
    teamMemberId: "1000000005",
    name: "Jennifer Martinez",
    email: "jennifer@acmeinspections.com",
    phone: "555-567-8901",
    role: "OFFICE_STAFF",
    status: "active",
    location: "Austin, TX",
    inspections: 0,
    rating: null,
    certifications: [],
    joinedDate: "May 2022",
    customPermissions: [],
  },
  {
    id: "6",
    teamMemberId: "1000000006",
    name: "Tom Anderson",
    email: "tom@acmeinspections.com",
    phone: "555-678-9012",
    role: "ADMIN",
    status: "active",
    location: "Austin, TX",
    inspections: 0,
    rating: null,
    certifications: [],
    joinedDate: "Jun 2022",
    customPermissions: [],
  },
];
export const credentials: Record<string, { passwordHash: string; mustReset: boolean }> = {};
export type Invite = {
  tokenHash: string;
  teamMemberId: string;
  expiresAt: number;
  usedAt: number | null;
};
export const invites: Invite[] = [];

function getRandomBytes(len: number): number[] {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    return Array.from(arr);
  } else {
    // Node.js
    return Array.from(crypto.randomBytes(len));
  }
}

function randomHex(len: number): string {
  return getRandomBytes(len)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sha256(str: string): string {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    // Browser: async, but for mock, use sync fallback
    return str;
  } else {
    // Node.js
    return crypto.createHash("sha256").update(str).digest("hex");
  }
}

function uuidv4(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  } else {
    return uuidv4Node();
  }
}

function generateTeamMemberId(): string {
  let id: string;
  do {
    id = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  } while (teamMembers.some((m) => m.teamMemberId === id));
  return id;
}

export function createTeamMember(data: Partial<TeamMember>) {
  const id = uuidv4();
  const teamMemberId = generateTeamMemberId();
  const member: TeamMember = {
    id,
    teamMemberId,
    avatarUrl: data.avatarUrl,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    role: data.role || "INSPECTOR",
    status: data.status || "active",
    location: data.location || "",
    inspections: data.inspections || 0,
    rating: data.rating || null,
    certifications: data.certifications || [],
    joinedDate: data.joinedDate || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    customPermissions: data.customPermissions || [],
  };
  teamMembers.push(member);
  return member;
}

export function getTeamMembers() {
  return teamMembers;
}

export function getTeamMemberById(teamMemberId: string) {
  return teamMembers.find((m) => m.teamMemberId === teamMemberId) || null;
}

export function updateTeamMember(teamMemberId: string, data: Partial<TeamMember>) {
  const idx = teamMembers.findIndex((m) => m.teamMemberId === teamMemberId);
  if (idx === -1) return null;
  teamMembers[idx] = { ...teamMembers[idx], ...data };
  return teamMembers[idx];
}

export function deleteTeamMember(teamMemberId: string) {
  const idx = teamMembers.findIndex((m) => m.teamMemberId === teamMemberId);
  if (idx === -1) return false;
  teamMembers[idx].status = "inactive";
  return true;
}

export function createInvite(teamMemberId: string, expiresInHours = 48) {
  const token = randomHex(32);
  const tokenHash = sha256(token);
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  invites.push({ tokenHash, teamMemberId, expiresAt, usedAt: null });
  return token;
}

export async function activateTeamMember(token: string, newPassword: string, bcrypt: { hash: (password: string, saltOrRounds: number) => Promise<string> }) {
  const tokenHash = sha256(token);
  const invite = invites.find((i) => i.tokenHash === tokenHash && !i.usedAt && i.expiresAt > Date.now());
  if (!invite) return { error: "Invalid or expired invite" };
  const member = getTeamMemberById(invite.teamMemberId);
  if (!member || member.status !== "active") return { error: "Account inactive" };
  const passwordHash = await bcrypt.hash(newPassword, 12);
  credentials[invite.teamMemberId] = { passwordHash, mustReset: false };
  invite.usedAt = Date.now();
  return { success: true };
}

export async function loginTeamMember(teamMemberId: string, password: string, bcrypt: { compare: (password: string, hash: string) => Promise<boolean> }) {
  if (!/^\d{10}$/.test(teamMemberId)) return null;
  const cred = credentials[teamMemberId];
  if (!cred) return null;
  const valid = await bcrypt.compare(password, cred.passwordHash);
  if (!valid) return null;
  const member = getTeamMemberById(teamMemberId);
  if (!member || member.status !== "active") return null;
  return { id: member.id, teamMemberId, role: member.role, name: member.name };
}
