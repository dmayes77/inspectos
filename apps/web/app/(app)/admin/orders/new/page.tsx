import { AdminShell } from "@/components/layout/admin-shell";
import { OrderForm } from "@/components/orders/order-form";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function NewOrderPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <OrderForm mode="new" />
    </AdminShell>
  );
}
