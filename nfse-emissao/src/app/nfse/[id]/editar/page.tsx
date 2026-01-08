'use client';

import { useParams } from 'next/navigation';
import { NFSeForm } from '../../../../components/nfse/NFSeForm';

export default function EditarNFSePage() {
  // Usar useParams para obter o ID da URL de forma segura no cliente
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  
  return (
    <NFSeForm notaFiscalId={id} />
  );
}