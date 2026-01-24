import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { User, Calendar } from "lucide-react";
import { PropertyTypeIcon } from "./property-type-icon";
import { formatTimestamp } from "@/lib/utils/dates";
import { Property } from "@/hooks/use-properties";

function PropertyAddressCell({ property }: { property: Property }) {
  return (
    <Link
      href={`/admin/properties/${property.id}`}
      className="flex items-start gap-2 font-medium hover:underline"
    >
      <PropertyTypeIcon type={property.property_type} />
      <div>
        <p>{property.address_line1}</p>
        {property.address_line2 && (
          <p className="text-sm text-muted-foreground">{property.address_line2}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {property.city}, {property.state} {property.zip_code}
        </p>
      </div>
    </Link>
  );
}

function PropertyTypeCell({ type }: { type: string }) {
  return (
    <Badge variant="outline" className="capitalize">
      {type.replace("-", " ")}
    </Badge>
  );
}

function PropertyOwnerCell({ property }: { property: Property }) {
  if (!property.client) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Link
      href={`/admin/clients/${property.client.id}`}
      className="flex items-center gap-2 text-sm hover:underline"
    >
      <User className="h-3.5 w-3.5 text-muted-foreground" />
      {property.client.name}
    </Link>
  );
}

function PropertyYearCell({ year }: { year: number | null }) {
  return (
    <span className="text-sm">
      {year ?? <span className="text-muted-foreground">—</span>}
    </span>
  );
}

function PropertySizeCell({ squareFeet }: { squareFeet: number | null }) {
  return (
    <span className="text-sm">
      {squareFeet ? (
        `${squareFeet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqft`
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </span>
  );
}

function PropertyCreatedCell({ createdAt }: { createdAt: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Calendar className="h-3.5 w-3.5" />
      {formatTimestamp(createdAt)}
    </div>
  );
}

export const propertiesTableColumns: ColumnDef<Property>[] = [
  {
    id: "address",
    header: "Address",
    cell: ({ row }) => <PropertyAddressCell property={row.original} />,
  },
  {
    accessorKey: "property_type",
    header: "Type",
    cell: ({ row }) => <PropertyTypeCell type={row.original.property_type} />,
  },
  {
    id: "client",
    header: "Owner/Contact",
    cell: ({ row }) => <PropertyOwnerCell property={row.original} />,
  },
  {
    accessorKey: "year_built",
    header: "Year Built",
    cell: ({ row }) => <PropertyYearCell year={row.original.year_built} />,
  },
  {
    accessorKey: "square_feet",
    header: "Size",
    cell: ({ row }) => <PropertySizeCell squareFeet={row.original.square_feet} />,
  },
  {
    id: "created",
    header: "Added",
    cell: ({ row }) => <PropertyCreatedCell createdAt={row.original.created_at} />,
  },
];
