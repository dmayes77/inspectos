"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function BookIndexPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const slug = (params as { companySlug?: string }).companySlug || "";
    router.replace(`/book/${slug}/contact`);
  }, [params, router]);

  return null;
}
