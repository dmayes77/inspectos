import EditInspectionPage from "@/components/inspections/inspection-editor";

export default function NewInspectionPage({ searchParams }: { searchParams?: { orderId?: string } }) {
  return <EditInspectionPage isNew orderId={searchParams?.orderId} />;
}
