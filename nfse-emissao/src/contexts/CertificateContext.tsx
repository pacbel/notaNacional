"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface CertInfo {
  thumbprint: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
}

interface CertificateContextValue {
  selectedCertId: string | null;
  setSelectedCertId: (id: string | null) => void;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  availableCerts: CertInfo[];
  setAvailableCerts: (list: CertInfo[]) => void;
}

const CertificateContext = createContext<CertificateContextValue | undefined>(undefined);

const STORAGE_KEY = "nfse_cert_thumbprint";

export function CertificateProvider({ children }: { children: React.ReactNode }) {
  const [selectedCertId, setSelectedCertIdState] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [availableCerts, setAvailableCerts] = useState<CertInfo[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelectedCertIdState(saved);
    } catch {}
  }, []);

  const setSelectedCertId = (id: string | null) => {
    setSelectedCertIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const value: CertificateContextValue = useMemo(() => ({
    selectedCertId,
    setSelectedCertId,
    modalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),
    availableCerts,
    setAvailableCerts,
  }), [selectedCertId, modalOpen, availableCerts]);

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  );
}

export function useCertificate() {
  const ctx = useContext(CertificateContext);
  if (!ctx) throw new Error("useCertificate deve ser usado dentro de CertificateProvider");
  return ctx;
}
