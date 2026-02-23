import { redirect } from "next/navigation";

export default function EmailTemplatesRedirect() {
  redirect("/settings/email-templates");
}
