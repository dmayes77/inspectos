import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function buildQueryString(searchParams: SearchParams): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }

  return query.toString();
}

export default async function AuthConfirmRedirectPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams(buildQueryString(resolvedSearchParams));
  if (!query.get("next")) {
    query.set("next", "/welcome");
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
  redirect(`${apiBase}/auth/confirm?${query.toString()}`);
}
