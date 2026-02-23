import { redirect } from "next/navigation";

export default function WorkflowsRedirect() {
  redirect("/app/settings/workflows");
}
