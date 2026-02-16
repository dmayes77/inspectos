"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@inspectos/shared/utils/dates";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import type { InvoiceRecord } from "@/hooks/use-invoices";

export const invoiceStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

export const formatInvoiceStatusLabel = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const invoiceTableColumns: ColumnDef<InvoiceRecord>[] = [
  {
    accessorKey: "invoiceId",
    header: "Invoice",
    enableHiding: false,
    cell: ({ row }) => (
      <Link
        href={`/admin/invoices/${row.original.invoiceId}`}
        className="text-xs font-medium hover:underline"
      >
        {row.original.invoiceNumber || formatInvoiceNumber(row.original.invoiceId)}
      </Link>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => <span className="text-xs">{row.original.clientName || "Unknown client"}</span>,
  },
  {
    accessorKey: "issuedDate",
    header: "Issued",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.issuedDate || "—")}</span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.dueDate || "—")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge color="light" className="text-xs capitalize">
        {formatInvoiceStatusLabel(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-xs font-medium">${row.original.amount.toFixed(2)}</span>
    ),
  },
];
