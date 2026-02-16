import { redirect } from "next/navigation";

export default function AdminContactsLeadsPage() {
  redirect("/admin/contacts?tab=leads");
}
