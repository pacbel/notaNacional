"use client";

import React from "react";
import NFSeCertGate from "@/components/certificados/NFSeCertGate";
import SelectCertModal from "@/components/certificados/SelectCertModal";

export default function NFSeClientGate() {
  return (
    <>
      <NFSeCertGate />
      <SelectCertModal />
    </>
  );
}
