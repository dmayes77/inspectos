"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
} from "lucide-react";
import type { Client } from "@/hooks/use-clients";
import { formatDistanceToNow } from "date-fns";

export function getContactTypeBadge(type: string) {
  const variants: Record<string, { color: "primary" | "light", className?: string }> = {
    "Homebuyer": { color: "light" },
    "Seller": { color: "light" },
    "Homeowner": { color: "primary", className: "bg-green-500 hover:bg-green-600" },
    "Real Estate Agent": { color: "primary", className: "bg-brand-500 hover:bg-brand-600" },
  };

  const config = variants[type] || { color: "light" as const };

  return (
    <Badge color={config.color} className={config.className}>
      {type}
    </Badge>
  );
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "Never";
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

type ClientRow = { original: Client };

export const contactsTableColumns: ColumnDef<Client>[] = [
  // Client info - Always visible
  {
    accessorKey: "name",
    header: "Client",
    enableSorting: true,
    enableHiding: false,
    cell: ({ row }: { row: ClientRow }) => {
      const client = row.original;
      return (
        <Link
          href={`/app/contacts/${client.clientId}`}
          className="flex flex-col gap-0.5 hover:opacity-80 transition-opacity py-2"
        >
          <span className="font-medium">{client.name}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
        </Link>
      );
    },
  },

  // Type badge - Always visible but compact
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: false,
    cell: ({ row }: { row: ClientRow }) => getContactTypeBadge(row.original.type),
  },

  // Stats - Combined inspections and revenue
  {
    id: "stats",
    header: "Stats",
    enableSorting: false,
    cell: ({ row }: { row: ClientRow }) => {
      const client = row.original;
      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{client.inspections || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>${((client.totalSpent || 0) / 1000).toFixed(1)}k</span>
          </div>
        </div>
      );
    },
  },

  // Last active - Show on larger screens
  {
    accessorKey: "lastInspection",
    header: "Last Active",
    enableSorting: true,
    cell: ({ row }: { row: ClientRow }) => {
      const lastInspection = row.original.lastInspection;
      return (
        <div className="text-sm text-muted-foreground">
          {formatRelativeDate(lastInspection)}
        </div>
      );
    },
  },

  // Actions dropdown - Always visible
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }: { row: ClientRow }) => {
      const client = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/app/contacts/${client.clientId}`}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/app/contacts/${client.clientId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit client
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`mailto:${client.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Send email
              </a>
            </DropdownMenuItem>
            {client.phone && (
              <DropdownMenuItem asChild>
                <a href={`tel:${client.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call client
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                // TODO: Implement delete with confirmation dialog
                console.log("Delete client:", client.clientId);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
