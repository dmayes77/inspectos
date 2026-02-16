import { redirect } from "next/navigation";

export default function ServicesRedirect() {
  redirect("/admin/settings/services");
}
