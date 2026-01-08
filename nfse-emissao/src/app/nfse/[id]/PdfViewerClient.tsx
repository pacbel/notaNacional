"use client";

import { useEffect, useMemo, useState } from "react";

type CertInfo = { thumbprint: string; subject?: string; notAfter?: string };

export default function PdfViewerClient({ chave, ambiente }: { chave: string; ambiente: number }) {
  const [certificateId, setCertificateId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [loading] = useState<boolean>(false);
  const [error] = useState<string>("");

  const iframeSrc = useMemo(() => {
    const base = `/api/nfse/danfse?chave=${encodeURIComponent(chave)}&ambiente=${Number(ambiente || 2)}`;
    return certificateId ? `${base}&certificateId=${encodeURIComponent(certificateId)}` : "";
  }, [chave, ambiente, certificateId]);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem("nfse_cert_thumbprint") : null;
      if (saved) setCertificateId(saved);
    } catch {}
  }, []);

  if (!mounted) {
    return <div className="w-full h-[80vh] border rounded bg-gray-50" />;
  }

  if (!certificateId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        <p>Certificado não definido. Selecione o certificado em uma tela apropriada antes de visualizar o PDF.</p>
      </div>
    );
  }

  return (
    <iframe
      title="DANFSe"
      src={iframeSrc}
      className="w-full h-[80vh] border rounded"
    />
  );
}
