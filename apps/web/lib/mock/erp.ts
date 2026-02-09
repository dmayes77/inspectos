import { inspections } from "@/lib/mock/inspections";
import { services } from "@/lib/mock/services";
import { calculateServiceDurationMinutes } from "@inspectos/shared/utils/pricing";
import { createServiceMap, getServiceNameById } from "@inspectos/shared/utils/services";

type LeadStage = "New" | "Qualified" | "Quoted" | "Scheduled" | "Won" | "Lost";

export type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  address: string;
  inspector: string;
  inspectorId: string;
  status: string;
  type: string;
  price: number;
  durationMinutes: number;
};

export type CrmLead = {
  id: string;
  name: string;
  email: string;
  stage: LeadStage;
  service: string;
  requestedDate: string;
  value: number;
};

export type CrmClient = {
  id: string;
  name: string;
  email: string;
  lastInspectionDate: string;
  totalSpent: number;
  inspections: number;
};

export type Invoice = {
  id: string;
  inspectionId: string;
  client: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
};

export type Payment = {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  date: string;
  method: "Card" | "ACH" | "Check" | "Cash";
};

const addDays = (dateStr: string, days: number) => {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const formatEmail = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\\.+/g, ".") || "client"}@example.com`;

const serviceMap = createServiceMap(services);

const getInspectionDurationMinutes = (serviceIds: string[] | undefined) => {
  if (!serviceIds || serviceIds.length === 0) return 90;
  const total = calculateServiceDurationMinutes(serviceIds, services);
  return total || 90;
};

const getPrimaryServiceName = (serviceIds: string[] | undefined) => {
  if (!serviceIds || serviceIds.length === 0) return "Inspection";
  return getServiceNameById(serviceIds[0], serviceMap);
};

export function getScheduleItems(): ScheduleItem[] {
  return inspections
    .map((inspection) => ({
      id: inspection.inspectionId,
      date: inspection.date,
      time: inspection.time,
      address: inspection.address,
      inspector: inspection.inspector,
      inspectorId: inspection.inspectorId,
      status: inspection.status,
      type: getPrimaryServiceName(inspection.types),
      price: inspection.price,
      durationMinutes: getInspectionDurationMinutes(inspection.types),
    }))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function getCrmLeads(): CrmLead[] {
  const stageMap: Record<string, LeadStage> = {
    scheduled: "Scheduled",
    in_progress: "Qualified",
    pending_report: "Won",
    completed: "Won",
  };

  return inspections
    .filter((inspection) => inspection.status !== "completed")
    .map((inspection) => ({
      id: inspection.inspectionId,
      name: inspection.client,
      email: formatEmail(inspection.client),
      stage: stageMap[inspection.status] ?? "New",
      service: getPrimaryServiceName(inspection.types),
      requestedDate: inspection.date,
      value: inspection.price,
    }));
}

export function getCrmClients(): CrmClient[] {
  const map = new Map<string, CrmClient>();

  inspections.forEach((inspection) => {
    const key = inspection.clientId || inspection.client;
    const existing = map.get(key);
    const lastDate = existing?.lastInspectionDate ?? inspection.date;
    const nextLastDate = inspection.date > lastDate ? inspection.date : lastDate;
    map.set(key, {
      id: key,
      name: inspection.client,
      email: formatEmail(inspection.client),
      inspections: (existing?.inspections ?? 0) + 1,
      totalSpent: (existing?.totalSpent ?? 0) + inspection.price,
      lastInspectionDate: nextLastDate,
    });
  });

  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

export function getInvoices(): Invoice[] {
  const today = new Date().toISOString().slice(0, 10);
  return inspections.map((inspection, index) => {
    const issuedDate = inspection.date;
    const dueDate = addDays(issuedDate, 7);
    const baseStatus: Invoice["status"] =
      inspection.status === "completed" ? "paid" : inspection.status === "scheduled" ? "draft" : "sent";
    const status =
      baseStatus !== "paid" && dueDate < today ? "overdue" : baseStatus;

    return {
      id: `INV-${1000 + index}`,
      inspectionId: inspection.inspectionId,
      client: inspection.client,
      amount: inspection.price,
      issuedDate,
      dueDate,
      status,
    };
  });
}

export function getPayments(): Payment[] {
  const methods: Payment["method"][] = ["Card", "ACH", "Check", "Cash"];
  return getInvoices()
    .filter((invoice) => invoice.status === "paid")
    .map((invoice, index) => ({
      id: `PAY-${9000 + index}`,
      invoiceId: invoice.id,
      client: invoice.client,
      amount: invoice.amount,
      date: invoice.issuedDate,
      method: methods[index % methods.length],
    }));
}

export function getReportMetrics() {
  const leads = getCrmLeads();
  const invoices = getInvoices();
  const payments = getPayments();
  const paidRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalLeads = leads.length || 1;
  const wonLeads = leads.filter((lead) => lead.stage === "Won").length;
  const conversionRate = Math.round((wonLeads / totalLeads) * 100);

  return {
    paidRevenue,
    inspectionVolume: inspections.length,
    conversionRate,
    outstandingInvoices: invoices.filter((invoice) => invoice.status !== "paid").length,
  };
}
