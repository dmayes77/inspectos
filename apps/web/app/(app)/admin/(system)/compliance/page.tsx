import { redirect } from "next/navigation";

export default function ComplianceRedirect() {
  redirect("/admin/settings/compliance");
}
