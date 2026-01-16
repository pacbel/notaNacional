import { redirect } from "next/navigation";

import { UsuariosPage } from "@/components/usuarios/usuarios-page";
import { getCurrentUser } from "@/lib/auth";
import { canAccessUsuarios } from "@/lib/permissions";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  // Verificar permissão
  if (!canAccessUsuarios(user.role)) {
    redirect("/dashboard");
  }

  return <UsuariosPage />;
}
