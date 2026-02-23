import { redirect } from "next/navigation";

export default function EmailTemplatesRedirect() {
  redirect("/app/settings/email-templates");
}
