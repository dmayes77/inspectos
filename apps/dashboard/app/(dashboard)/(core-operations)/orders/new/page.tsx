import { OrderForm } from "@/components/orders/order-form";

type SearchParams = {
  propertyId?: string | string[];
  clientId?: string | string[];
  agentId?: string | string[];
};

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const propertyId = first(resolvedSearchParams.propertyId);
  const clientId = first(resolvedSearchParams.clientId);
  const agentId = first(resolvedSearchParams.agentId);

  return (
    <OrderForm
      mode="new"
      initialValues={{
        property_id: propertyId,
        client_id: clientId ?? null,
        agent_id: agentId ?? null,
      }}
    />
  );
}
