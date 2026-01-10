import type { Metadata } from "next";
import { Suspense } from "react";

import NfsePageContent from "@/components/nfse/nfse-page-content";

export const metadata: Metadata = {
  title: "Notas Fiscais | NotaClient",
};

export default function NfsePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">
          Centralize o acompanhamento das suas NFSe emitidas e das DPS prontas para envio.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando dados da NFSe...</p>}>
        <NfsePageContent />
      </Suspense>
    </div>
  );
}
