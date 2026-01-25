import EditInspectionPage from "../[id]/edit/page";

export default function NewInspectionPage({ searchParams }: { searchParams?: { orderId?: string } }) {
  return <EditInspectionPage isNew orderId={searchParams?.orderId} />;
}
