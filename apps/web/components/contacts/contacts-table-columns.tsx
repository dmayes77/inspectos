"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Mail, Phone } from "lucide-react";
import type { Client } from "@/hooks/use-clients";

export function getContactTypeBadge(type: string) {
  switch (type) {
    case "Homebuyer":
      return <Badge variant="secondary">Homebuyer</Badge>;
    case "Real Estate Agent":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Agent</Badge>;
    case "Seller":
      return <Badge variant="outline">Seller</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

type ClientRow = { original: Client };

export const contactsTableColumns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }: { row: ClientRow }) => (
      <Link href={`/admin/contacts/clients/${row.original.clientId}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    enableSorting: false,
    cell: ({ row }: { row: ClientRow }) => (
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3 w-3" />
          {row.original.email}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3 w-3" />
          {row.original.phone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
    cell: ({ row }: { row: ClientRow }) => getContactTypeBadge(row.original.type),
  },
  {
    accessorKey: "inspections",
    header: "Inspections",
    enableSorting: true,
    cell: ({ row }: { row: ClientRow }) => (
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <span>{row.original.inspections}</span>
      </div>
    ),
  },
  {
    accessorKey: "lastInspection",
    header: "Last Inspection",
    enableSorting: true,
    cell: ({ row }: { row: ClientRow }) => (
      <div className="text-sm text-muted-foreground">{row.original.lastInspection}</div>
    ),
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    enableSorting: true,
    cell: ({ row }: { row: ClientRow }) => (
      <div className="font-medium">${row.original.totalSpent.toLocaleString()}</div>
    ),
  },
];
