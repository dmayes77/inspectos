import { redirect } from "next/navigation";

export default function WorkflowsRedirect() {
  redirect("/admin/settings/workflows");
}
