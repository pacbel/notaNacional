import { Suspense } from "react";

import RecoverPasswordView from "@/components/auth/recover-password-view";

export default function RecoverPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
      <RecoverPasswordView />
    </Suspense>
  );
}
