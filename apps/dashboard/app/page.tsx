import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACCESS_COOKIE_NAME = "inspectos_access_token";

export default async function RootPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (accessToken) {
    redirect("/overview");
  }

  redirect("/login");
}
