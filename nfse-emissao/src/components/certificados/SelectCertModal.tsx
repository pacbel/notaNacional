"use client";
import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { listarCertificados } from '@/lib/nfse-nacional/localClient';
import { useCertificate } from '@/contexts/CertificateContext';

interface CertLite {
  thumbprint: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
}

export default function SelectCertModal() {
  const { modalOpen, closeModal, selectedCertId, setSelectedCertId, setAvailableCerts } = useCertificate();
  const [loading, setLoading] = useState(false);
  const [certs, setCerts] = useState<CertLite[]>([]);
  const [selIndex, setSelIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    (async () => {
      try {
        setLoading(true);
        const list = await listarCertificados();
        const dataApi: unknown = Array.isArray(list) ? list : [];
        const mapped: CertLite[] = (dataApi as Array<Record<string, unknown>>).map((c) => ({
          thumbprint: String(c.id ?? ''),
          subject: String((c.subject ?? c.commonName ?? '') as string) || undefined,
          validFrom: (c.notBefore as string) || undefined,
          validTo: (c.notAfter as string) || undefined,
        }));
        setCerts(mapped);
        setAvailableCerts(mapped);
        // Pré-selecionar: tenta manter seleção anterior, senão primeira com thumbprint válido
        const idxFromSaved = selectedCertId ? mapped.findIndex(c => c.thumbprint === selectedCertId) : -1;
        if (idxFromSaved >= 0) setSelIndex(idxFromSaved);
        else if (mapped.length > 0) {
          const firstValid = mapped.findIndex(c => !!c.thumbprint);
          setSelIndex(firstValid >= 0 ? firstValid : 0);
        } else {
          setSelIndex(null);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        message.error(`Falha ao listar certificados: ${msg}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [modalOpen, setAvailableCerts, selectedCertId]);

  const handleOk = () => {
    if (selIndex === null) {
      message.warning('Selecione um certificado');
      return;
    }
    const cert = certs[selIndex];
    if (!cert) {
      message.error('Não foi possível identificar o certificado selecionado.');
      return;
    }
    const idToSave = cert.thumbprint?.trim() || `${cert.subject ?? 'cert'}#${selIndex}`;
    if (!cert.thumbprint) {
      message.warning('Este certificado não expõe Thumbprint. Usando identificação alternativa.');
    }
    setSelectedCertId(idToSave);
    closeModal();
    message.success('Certificado selecionado');
  };

  return (
    !modalOpen ? null : (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
        <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg border">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Selecionar Certificado Digital</h3>
            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
            {loading ? (
              <div>Carregando certificados...</div>
            ) : certs.length === 0 ? (
              <div>Nenhum certificado encontrado no Windows Store.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {certs.map((c, i) => (
                  <label key={`${c.thumbprint ?? 'cert'}-${i}`} className={`flex items-start gap-2 border rounded p-2 cursor-pointer ${!c.thumbprint ? 'opacity-80' : ''}`}>
                    <input
                      type="radio"
                      name="cert"
                      checked={selIndex === i}
                      onChange={() => setSelIndex(i)}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{c.subject || c.thumbprint}</span>
                      <span className="text-xs text-gray-500">Thumbprint: {c.thumbprint || '(indisponível)'}</span>
                      {!c.thumbprint && (
                        <span className="text-[11px] text-amber-600">Este certificado não expõe o thumbprint. Selecione outro.</span>
                      )}
                      {c.validTo && <span className="text-xs text-gray-500">Válido até: {new Date(c.validTo).toLocaleString('pt-BR')}</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end gap-2">
            <button onClick={closeModal} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">Cancelar</button>
            <button onClick={handleOk} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>Usar este certificado</button>
          </div>
        </div>
      </div>
    )
  );
}
