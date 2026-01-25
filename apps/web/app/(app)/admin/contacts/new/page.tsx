"use client";

import { redirect } from "next/navigation";

export default function ContactsFallbackNewPage() {
  redirect("/admin/contacts/clients/new");
}
