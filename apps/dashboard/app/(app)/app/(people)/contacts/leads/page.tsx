import { redirect } from "next/navigation";

export default function AdminContactsLeadsPage() {
  redirect("/app/contacts?tab=leads");
}
