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
  const queryString = buildQueryString(resolvedSearchParams);
  redirect(queryString ? `/auth/callback?${queryString}` : "/auth/callback");
}
