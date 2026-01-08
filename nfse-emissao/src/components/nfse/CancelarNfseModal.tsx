import { useState } from 'react';
import { Modal, message } from 'antd';
import Select, { SingleValue, StylesConfig } from 'react-select';
import { useAuth } from '@/contexts/AuthContext';
import { useCertificate } from '@/contexts/CertificateContext';
import { cancelarNFSe } from '@/lib/nfse-nacional/localClient';
import { montarEventoCancelamentoXML } from '@/lib/nfse-nacional/eventoCancelamentoBuilder';
import pako from 'pako';

interface CancelarNfseModalProps {
  isOpen: boolean;
  onClose: () => void;
  numeroNfse: string;
  cnpj: string;
  inscricaoMunicipal: string;
  ambiente: number;
  onSuccess: () => void;
  idInfPedReg?: string; // Id exato retornado na recepção da DPS/NFSe
}

const MOTIVOS_CANCELAMENTO = [
  { value: '1', label: 'Erro na Emissão' },
  { value: '2', label: 'Serviço não concluído' },
  { value: '3', label: 'Outros' }
];

type MotivoOption = { value: string; label: string };

const selectStyles: StylesConfig<MotivoOption, false> = {
  control: (base) => ({
    ...base,
    minHeight: '36px',
    borderColor: '#d1d5db',
    '&:hover': {
      borderColor: '#3b82f6'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#e5e7eb' : undefined,
    ':active': {
      backgroundColor: '#3b82f6'
    }
  })
};

export function CancelarNfseModal(props: CancelarNfseModalProps) {
  const { isOpen, onClose, numeroNfse, ambiente, onSuccess } = props;
  const [codigoCancelamento, setCodigoCancelamento] = useState<string>();
  const [justificativa, setJustificativa] = useState<string>('');
  const [loading, setLoading] = useState(false);
  useAuth();
  const { selectedCertId, openModal: openCertModal } = useCertificate();

  const handleCancel = () => {
    setCodigoCancelamento(undefined);
    onClose();
  };

  const handleConfirm = async () => {
    if (!codigoCancelamento) {
      message.error('Selecione o motivo do cancelamento');
      return;
    }
    if (!justificativa || justificativa.trim().length < 15) {
      message.error('Informe uma justificativa (mínimo 15 caracteres)');
      return;
    }

    try {
      setLoading(true);
      // A API local pede o evento assinado e compactado em Base64 GZip
      // Precisamos da chave de acesso (50 dígitos). Se numeroNfse já for a chave (50), usamos; senão, alertamos.
      const chave = String(numeroNfse).replace(/\D+/g, '');
      console.log('[CancelarNfse] Chave recebida len=', chave.length, 'tail=', chave.slice(-10));
      if (chave.length !== 50) {
        message.error('Cancelamento: informe a chave de acesso completa com 50 dígitos.');
        return;
      }

      // Montar XML do evento (pedidoRegistroEvento)
      const nSeqEvt = '01';
      const nPedRegEvt = '1';
      const xmlEvento = montarEventoCancelamentoXML({
        chaveAcesso: chave,
        tpAmb: (ambiente === 1 ? 1 : 2) as 1 | 2,
        cpfCnpj: props.cnpj?.replace(/\D+/g, '') || undefined,
        nPedRegEvento: nPedRegEvt,
        nSeqEvento: nSeqEvt,
        idInfPedReg: props.idInfPedReg,
        xMotivo: justificativa.trim(),
        cMotivo: (codigoCancelamento as '1' | '2' | '3' | '4') || '1'
      });

      console.log("xmlEvento=>>>",xmlEvento);

      // Assinar tag infEvento usando certificado local
      const certificateId = selectedCertId || process.env.NEXT_PUBLIC_CERTIFICATE_ID || '';
      if (!certificateId) {
        message.warning('Selecione o certificado para prosseguir.');
        openCertModal();
        return;
      }

      // Assinar apenas 'infPedReg' (conforme guia)
      const signResp = await fetch('/api/nfse/assinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ xml: xmlEvento, tag: 'infPedReg', certificateId }),
      });
      if (!signResp.ok) {
        const t = await signResp.text().catch(() => '');
        throw new Error(t || 'Falha na assinatura do pedido de registro');
      }
      let xmlAssinado = await signResp.text();
      console.log('[CancelarNfse] XML (assinado infPedReg) len=', xmlAssinado.length);
      console.log('[CancelarNfse] XML preview start=', xmlAssinado.slice(0, 200));
      console.log('[CancelarNfse] XML preview end=', xmlAssinado.slice(-200));
      console.log('[CancelarNfse] has <xMotivo>?', xmlAssinado.includes('<xMotivo>'));
      console.log('[CancelarNfse] index <nPedRegEvento>=', xmlAssinado.indexOf('<nPedRegEvento>'), ' index </detEvento>=', xmlAssinado.indexOf('</detEvento>'));

      // Normalizar: mover <Signature> para imediatamente após </infPedReg>
      try {
        const sigRegex = /<(?:ds:)?Signature\b[\s\S]*?<\/(?:ds:)?Signature>/i;
        const closingInf = xmlAssinado.indexOf('</infPedReg>');
        const m = xmlAssinado.match(sigRegex) as any;
        if (closingInf !== -1 && m) {
          const sigBlock = m[0];
          const sigIndex = (m.index ?? xmlAssinado.indexOf(sigBlock)) as number;
          if (sigIndex !== -1 && sigIndex < closingInf) {
            let without = xmlAssinado.replace(sigRegex, '');
            xmlAssinado = without.replace('</infPedReg>', `</infPedReg>${sigBlock}`);
            console.log('[CancelarNfse] Signature movida para após </infPedReg>');
          }
        }
      } catch (e) {
        console.warn('[CancelarNfse] normalizeSignaturePlacementPedReg falhou:', (e as any)?.message || String(e));
      }

      // Escolha do modo de compactação: temporariamente permitir teste SEM GZip
      const useGzip = true;

      let b64: string;
      if (useGzip) {
        const gz = pako.gzip(xmlAssinado, { level: 9 });
        b64 = base64FromUint8(gz);
        console.log('[CancelarNfse] GZip bytes=', gz.length, 'b64 len=', b64.length);
        try {
          const backU8 = base64ToUint8(b64);
          const xmlBack = new TextDecoder().decode(pako.ungzip(backU8));
          console.log('[CancelarNfse] Roundtrip GZip OK? ', xmlBack.includes('<xMotivo>'), 'len=', xmlBack.length);
        } catch (e) {
          console.warn('[CancelarNfse] Roundtrip GZip FAILED:', (e as any)?.message || String(e));
        }
      } else {
        b64 = base64FromStringUtf8(xmlAssinado);
        console.log('[CancelarNfse] Enviando Base64 SEM GZip. b64 len=', b64.length);
        try {
          const backXml = new TextDecoder().decode(base64ToUint8(b64));
          console.log('[CancelarNfse] Roundtrip Base64 OK? ', backXml.includes('<xMotivo>'), 'len=', backXml.length);
        } catch (e) {
          console.warn('[CancelarNfse] Roundtrip Base64 FAILED:', (e as any)?.message || String(e));
        }
      }


      const idInfPedReg = `ID${chave}101101${nSeqEvt}`; // permanece no XML
      const idPedidoPayload = chave; // no payload NÂO enviar prefixo 'PRE'
      const payload = {
        chaveAcesso: chave,
        pedidoRegistroEvento: { id: idPedidoPayload, evento: b64 },
        ambiente: ambiente === 1 ? 1 : 2,
        certificateId,
        clientDispatched: true,
      };
      const payloadStr = JSON.stringify(payload);
      console.log('[CancelarNfse] Envio cancelar payload bytes=', payloadStr.length, 'evento len=', b64.length, 'useGzip=', useGzip, 'idInfPedReg(xml)=', idInfPedReg, 'idPedidoPayload=', idPedidoPayload);
      const resp = await fetch('/api/nfse/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payloadStr,
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        console.warn('[CancelarNfse] Falha cancelar. status=', resp.status, resp.statusText, 'body=', txt?.slice(0, 500));
        let msg = 'Falha ao cancelar NFSe';
        try {
          const j = JSON.parse(txt || '{}');
          if (Array.isArray(j?.erro) && j.erro.length) {
            msg = j.erro.map((e: any) => {
              const cod = e?.codigo ? String(e.codigo) : '';
              const desc = e?.descricao ? String(e.descricao) : '';
              const comp = e?.complemento ? String(e.complemento) : '';
              return [cod && `[${cod}]`, desc, comp].filter(Boolean).join(' ');
            }).join(' | ');
          } else if (j?.error || j?.message) {
            msg = String(j.error || j.message);
          }
        } catch {}
        message.error(msg);
        return;
      }
      const okText = await resp.text().catch(() => '');
      console.log('[CancelarNfse] Sucesso cancelar. status=', resp.status, 'resp=', okText?.slice(0, 500));

      message.success('Nota fiscal cancelada com sucesso!');
      onSuccess?.();
    } catch (e: any) {
      message.error(e?.message || 'Erro ao cancelar nota fiscal. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  function base64FromUint8(u8: Uint8Array): string {
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
    return btoa(binary);
  }

  function base64FromStringUtf8(s: string): string {
    const enc = new TextEncoder();
    const bytes = enc.encode(s);
    return base64FromUint8(bytes);
  }

  function base64ToUint8(b64: string): Uint8Array {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  return (
    <Modal
      title="Cancelar Nota Fiscal"
      open={isOpen}
      onCancel={handleCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processando...
              </span>
            ) : (
              'Confirmar Cancelamento'
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chave de Acesso</label>
          <input value={numeroNfse} disabled className="w-full rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo do Cancelamento
          </label>
          <Select
            placeholder="Selecione o motivo"
            options={MOTIVOS_CANCELAMENTO}
            value={MOTIVOS_CANCELAMENTO.find(m => m.value === codigoCancelamento)}
            onChange={(option: SingleValue<MotivoOption>) => setCodigoCancelamento(option?.value)}
            styles={selectStyles}
            isClearable
            className="text-sm"
            classNamePrefix="react-select"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justificativa
          </label>
          <textarea
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm min-h-24"
            placeholder="Descreva a justificativa do cancelamento"
          />
          <div className="mt-1 text-xs text-gray-500">Mínimo de 15 caracteres. {justificativa.trim().length}/15</div>
        </div>
      </div>
    </Modal>
  );
}
