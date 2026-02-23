import { redirect } from "next/navigation";

export default function ComplianceRedirect() {
  redirect("/app/settings/compliance");
}
