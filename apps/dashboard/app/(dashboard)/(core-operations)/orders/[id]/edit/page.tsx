import { redirect } from "next/navigation";

export default async function EditOrderRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/orders/${id}`);
}
