export type PropertyOwnerRow = {
  id: string;
  property_id: string;
  client_id: string;
  start_date: string;
  end_date: string | null;
  is_primary: boolean;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  } | null;
};

type RawPropertyOwnerRow = Omit<PropertyOwnerRow, "client"> & {
  client: PropertyOwnerRow["client"] | PropertyOwnerRow["client"][] | null;
};

export const PROPERTY_OWNER_SELECT = `
  id,
  property_id,
  client_id,
  start_date,
  end_date,
  is_primary,
  client:clients(id, name, email, phone, company)
`;

export function formatOwners(ownerRows: PropertyOwnerRow[]) {
  return ownerRows.map((owner) => ({
    propertyOwnerId: owner.id,
    propertyId: owner.property_id,
    clientId: owner.client_id,
    startDate: owner.start_date,
    endDate: owner.end_date,
    isPrimary: owner.is_primary,
    client: owner.client
      ? {
          id: owner.client.id,
          name: owner.client.name,
          email: owner.client.email ?? null,
          phone: owner.client.phone ?? null,
          company: owner.client.company ?? null,
        }
      : null,
  }));
}

export function normalizeOwnerRows(rows: RawPropertyOwnerRow[] = []): PropertyOwnerRow[] {
  return rows.map((row) => ({
    ...row,
    client: Array.isArray(row.client) ? (row.client?.[0] ?? null) : (row.client ?? null),
  }));
}

export function mapPropertyWithOwners(property: Record<string, unknown>, ownerRows: PropertyOwnerRow[] = []) {
  const owners = formatOwners(ownerRows);
  const currentOwner = owners.find((owner) => owner.isPrimary && owner.endDate === null) || owners.find((owner) => owner.endDate === null);

  return {
    ...property,
    owners,
    client: currentOwner?.client ?? null,
  };
}
