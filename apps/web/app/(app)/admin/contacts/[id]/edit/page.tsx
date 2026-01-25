import { redirect } from "next/navigation";

type LegacyClientEditPageProps = {
  params: {
    id: string;
  };
};

export default function LegacyClientEditPage({ params }: LegacyClientEditPageProps) {
  redirect(`/admin/contacts/clients/${params.id}/edit`);
}
