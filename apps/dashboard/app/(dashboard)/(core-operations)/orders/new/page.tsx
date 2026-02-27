import { OrderForm } from "@/components/orders/order-form";

type SearchParams = {
  propertyId?: string | string[];
  clientId?: string | string[];
  agentId?: string | string[];
};

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default function NewOrderPage({ searchParams }: { searchParams?: SearchParams }) {
  const propertyId = first(searchParams?.propertyId);
  const clientId = first(searchParams?.clientId);
  const agentId = first(searchParams?.agentId);

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
