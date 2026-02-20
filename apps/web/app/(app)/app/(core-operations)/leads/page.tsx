"use client";

import { redirect } from "next/navigation";

export default function LeadsRootRedirect() {
  redirect("/app/contacts?tab=leads");
}
