import { redirect } from "next/navigation";

export default function AdminContactsLeadsPage() {
  redirect("/contacts?tab=leads");
}
