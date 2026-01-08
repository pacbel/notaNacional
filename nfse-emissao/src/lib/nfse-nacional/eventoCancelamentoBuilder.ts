import { formatLocalDateTimeWithOffset } from './datetime';

export interface EventoCancelamentoInput {
  chaveAcesso: string;
  tpAmb: 1 | 2;
  cpfCnpj?: string;
  nPedRegEvento?: string | number; 
  nSeqEvento?: string | number;
  cMotivo?: '1' | '2' | '3' | '4';
  xMotivo?: string;
  idInfPedReg?: string; // permite usar o Id exato retornado na recepção
}

export function montarEventoCancelamentoXML(input: EventoCancelamentoInput): string {
  const chRaw = String(input.chaveAcesso || '').replace(/\D+/g, '');
  if (chRaw.length !== 50) throw new Error('chaveAcesso deve ter exatamente 50 dígitos');
  const ch50 = chRaw;
  const tpAmb = input.tpAmb === 1 ? 1 : 2;
  const dhEvento = formatLocalDateTimeWithOffset(new Date());
  const nSeqEvento = String(input.nSeqEvento ?? '01').padStart(2, '0');
  const nPedReg = String(input.nPedRegEvento ?? '1');
  const nPedReg3 = nPedReg.padStart(3, '0');
  const xMotivo = input.xMotivo?.toString().trim() || '';
  const cMotivo = input.cMotivo ?? '1';
  const cpfCnpj = input.cpfCnpj ?? '';
  if (xMotivo.length < 1) throw new Error('xMotivo/justificativa é obrigatório');

  // Construção do Id: permite override quando já conhecido (recepção)
  // Requisito: literal PRE dentro do XML (antes de compactar) => PRE{chaveAcesso}{codigoEvento(6=101101)}
  // Padrão do TSIdPedRefEvt observado: PRE{chave50}{101101}{nPedRegEvento(3 dígitos)}
  let id = input.idInfPedReg?.toString().trim() || `PRE${ch50}101101${nPedReg3}`;

  console.log('ID Final Gerado (infPedReg):', id);

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<pedRegEvento xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.00">` +
      `<infPedReg Id="${id}">` +
        `<tpAmb>${tpAmb}</tpAmb>` +
        `<verAplic>NFSE_NACIONAL_1.00</verAplic>` +
        `<dhEvento>${dhEvento}</dhEvento>` +
        `${(() => {
          const digits = cpfCnpj.replace(/\D+/g, '');
          if (digits.length === 11) return `<CPFAutor>${escapeXml(digits)}</CPFAutor>`;
          return `<CNPJAutor>${escapeXml(digits)}</CNPJAutor>`;
        })()}` +
        `<chNFSe>${ch50}</chNFSe>` +
        `<nPedRegEvento>${escapeXml(nPedReg)}</nPedRegEvento>` +
        `<e101101>` +
          `<xDesc>Cancelamento de NFS-e</xDesc>` +
          `<cMotivo>${cMotivo}</cMotivo>` +
          `<xMotivo>${escapeXml(xMotivo).slice(0, 255)}</xMotivo>` +
        `</e101101>` +
      `</infPedReg>` +
    `</pedRegEvento>`
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
