import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import LoginView from "@/components/auth/login-view";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginView />;
}
