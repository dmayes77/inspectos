import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createVendorsApi } from "@inspectos/shared/api";
import { vendorsQueryKeys } from "@inspectos/shared/query";

export type Vendor = {
  id: string;
  publicId: string;
  name: string;
  contactPerson?: string;
  vendorType?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

function normalize(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function useVendors() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return useGet<Vendor[]>(vendorsQueryKeys.all, () => vendorsApi.list<Vendor>());
}

export function useVendor(id: string) {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return useGet<Vendor>(
    vendorsQueryKeys.detail(id),
    () => vendorsApi.getById<Vendor>(id),
    { enabled: !!id },
  );
}

export function useCreateVendor() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return usePost<Vendor, Partial<Vendor>>(
    vendorsQueryKeys.all,
    (data) =>
      vendorsApi.create<Vendor>({
        name: data.name,
        contact_person: normalize(data.contactPerson),
        vendor_type: normalize(data.vendorType),
        email: normalize(data.email),
        phone: normalize(data.phone),
        address_line1: normalize(data.addressLine1),
        address_line2: normalize(data.addressLine2),
        city: normalize(data.city),
        state_region: normalize(data.stateRegion),
        postal_code: normalize(data.postalCode),
        country: normalize(data.country),
        notes: normalize(data.notes),
        status: data.status,
      }),
  );
}

export function useUpdateVendor() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return usePut<Vendor, Partial<Vendor> & { id: string }>(
    vendorsQueryKeys.all,
    ({ id, ...data }) =>
      vendorsApi.update<Vendor>(id, {
        name: data.name,
        contact_person: data.contactPerson !== undefined ? normalize(data.contactPerson) : undefined,
        vendor_type: data.vendorType !== undefined ? normalize(data.vendorType) : undefined,
        email: data.email !== undefined ? normalize(data.email) : undefined,
        phone: data.phone !== undefined ? normalize(data.phone) : undefined,
        address_line1: data.addressLine1 !== undefined ? normalize(data.addressLine1) : undefined,
        address_line2: data.addressLine2 !== undefined ? normalize(data.addressLine2) : undefined,
        city: data.city !== undefined ? normalize(data.city) : undefined,
        state_region: data.stateRegion !== undefined ? normalize(data.stateRegion) : undefined,
        postal_code: data.postalCode !== undefined ? normalize(data.postalCode) : undefined,
        country: data.country !== undefined ? normalize(data.country) : undefined,
        notes: data.notes !== undefined ? normalize(data.notes) : undefined,
        status: data.status,
      }),
  );
}

export function useDeleteVendor() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return useDelete<boolean>(
    vendorsQueryKeys.all,
    (id) => vendorsApi.remove<boolean>(id),
  );
}
