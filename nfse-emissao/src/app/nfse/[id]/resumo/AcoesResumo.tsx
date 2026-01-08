"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function AcoesResumo({ id, protocolo }: { id: string, transmitida: boolean, protocolo?: string }) {
  // router não utilizado neste componente
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|undefined>(undefined);
  const [protocoloResp, setProtocoloResp] = useState<string|undefined>(protocolo);

  const transmitir = async () => {
    setLoading(true);
    setMsg(undefined);
    try {
      const res = await fetch(`/api/nfse/${id}/service/emitir-nfse-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': '123456'
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Nota transmitida com sucesso! Protocolo: ' + data.protocolo);
        setProtocoloResp(data.protocolo);
      } else {
        setMsg('Erro ao transmitir: ' + (data.message ?? 'Erro desconhecido.'));
      }
    } catch (_) {
      setMsg('Falha ao transmitir nota.');
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 flex flex-col gap-2">
      {protocoloResp ? (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          Nota já transmitida. Protocolo: <b>{protocoloResp}</b>
        </div>
      ) : (
        <>
          <button
            onClick={transmitir}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {loading ? 'Transmitindo...' : 'Transmitir agora'}
          </button>
          <Link href="/nfse" className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 transition text-gray-700 text-center">
            Salvar e voltar para lista
          </Link>
        </>
      )}
      {msg && <div className="mt-2 text-sm text-gray-700">{msg}</div>}
    </div>
  );
}
