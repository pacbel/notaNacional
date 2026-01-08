"use client";
import { useEffect } from 'react';
import { useCertificate } from '@/contexts/CertificateContext';

export default function NFSeCertGate() {
  const { selectedCertId, openModal } = useCertificate();

  useEffect(() => {
    // Se não houver certificado selecionado no storage/context, abre o modal na primeira entrada
    const stored = (typeof window !== 'undefined') ? localStorage.getItem('nfse_cert_thumbprint') : null;
    if (!selectedCertId && !stored) {
      openModal();
    }
  }, [selectedCertId, openModal]);

  return null;
}
