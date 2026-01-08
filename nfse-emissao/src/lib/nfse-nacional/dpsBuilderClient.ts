// lib/nfse-nacional/dpsBuilderClient.ts
// UTF-8 - Cliente (browser) - sem dependências de env
import { formatLocalDateTimeWithOffset } from './datetime';

export interface PrestadorInfo {
  cnpj: string; // apenas dígitos
  im?: string;
  razao: string;
  codigoMunicipio: string; // IBGE 7 dígitos
  uf: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
}

export interface DPSClientInput {
  numeroAtendimento: string;
  competencia: string; // YYYY-MM-DD
  naturezaOperacao?: number; // legado: não usar como tpAmb
  tpAmb?: 1|2; // 1=produção, 2=homologação (obrigatório)
  verAplicDPS?: string; // versão do aplicativo emissor (obrigatório)
  prestador: PrestadorInfo;
  prestadorContato?: { fone?: string; email?: string }; // opcional
  prestadorRegTrib?: { opSimpNac?: 1|2|3; regEspTrib?: 0|1 }; // 1=Não optante, 2=MEI, 3=ME/EPP
  serie: string; // série da DPS/NFSe (numérica)
  nDPS: string;  // número sequencial da DPS (15 dígitos no ID)
  tomador: {
    cpfCnpj: string;
    im?: string;
    razaoSocial: string;
    email?: string;
    telefone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipio: string; // 7 dígitos
      uf: string;
      cep: string;
    };
  };
  servico: {
    codigoTribNac: string; // NN.NNNN (numérico sem pontos no XML)
    codigoTribMun?: string;
    discriminacao: string;
    valor: number;
    aliquota?: number;
  };
  locPrestacaoCodigo?: string; // IBGE 7 da prestação (opcional; default: cLocEmi)
  infoComplTemplate?: string; // ex.: "Atendimento {{numeroAtendimento}}"
  tributacao?: {
    tribISSQN: 1|2|3|4|5|6; // conforme layout do DPS
    tpImunidade?: 1|2|3; // somente quando tribISSQN=2 (Imune)
    tpRetISSQN: 1|2|3; // 1=Não retido (prestador recolhe), 2=Retido pelo tomador, 3=Retido pelo intermediário
    pTotTribFed?: string; // percentual em string com 2 casas, ex.: "0.00"
    pTotTribEst?: string;
    pTotTribMun?: string;
  }
}

function digitsOnly(s: string) { return (s || '').replace(/\D+/g, ''); }

// Helpers para validações e normalizações específicas do TSIdDPS
function padLeft(value: string, len: number): string {
  return String(value || '').padStart(len, '0').slice(-len);
}

function ensureFixedDigits(value: string, len: number, fieldName: string): string {
  const digits = digitsOnly(value);
  if (!digits) throw new Error(`${fieldName} inválido: vazio`);
  if (digits.length > len) throw new Error(`${fieldName} inválido: mais de ${len} dígitos`);
  return padLeft(digits, len);
}

function sanitizeText(input: string): string {
  if (!input) return '';
  // Remove acentos e normaliza para ASCII básico
  const noDiacritics = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Normaliza espaços: converte NBSP, colapsa espaços/tabs e aplica trim
  const normalizedSpaces = noDiacritics
    .replace(/\u00A0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .trim();
  // Substitui & < > por entidades
  const xmlSafe = normalizedSpaces
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Remove caracteres de controle exceto \n \r \t
  return xmlSafe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

class XmlWriter {
  private parts: string[] = [];
  private escAttr(v: string) {
    return sanitizeText(v).replace(/"/g, '&quot;');
  }
  decl(version = '1.0', encoding = 'UTF-8') {
    this.parts.push(`<?xml version="${version}" encoding="${encoding}"?>`);
  }
  open(name: string, attrs?: Record<string, string>) {
    if (attrs && Object.keys(attrs).length) {
      const a = Object.entries(attrs).map(([k, v]) => `${k}="${this.escAttr(v)}"`).join(' ');
      this.parts.push(`<${name} ${a}>`);
    } else {
      this.parts.push(`<${name}>`);
    }
  }
  close(name: string) { this.parts.push(`</${name}>`); }
  text(txt: string) { this.parts.push(sanitizeText(txt)); }
  leaf(name: string, txt: string) { this.open(name); this.text(txt); this.close(name); }
  build() { return this.parts.join(''); }
}

export function montarDPSXMLCliente(dps: DPSClientInput): string {
  // Dados do Prestador
  const prest = dps.prestador;
  const prestCnpj14 = ensureFixedDigits(prest.cnpj, 14, 'CNPJ do prestador');
  const codMun7 = ensureFixedDigits(dps.prestador.codigoMunicipio, 7, 'Código do município (cLocEmi)');

  // Série: no ID exige 5 dígitos com zero à esquerda; no XML deve ser o valor original (sem padding)
  const serieNum = digitsOnly(String(dps.serie));
  if (!serieNum) throw new Error('Série inválida: vazio');
  const serieXml = String(parseInt(serieNum, 10));
  const serie5 = padLeft(serieNum, 5);

  // Tipo de inscrição no ID (1 = CPF, 2 = CNPJ)
  const tipoInscr = '2';
  
  // dhEmi no horário LOCAL com fuso (gera automaticamente). Permitir override futuro se necessário
  const now = new Date(Date.now() - 2*60*1000);
  const dhEmi = formatLocalDateTimeWithOffset(now);

  // nDPS: exatamente 15 dígitos (ID e XML) -> AAAA (ano corrente) + número do emitente em 11 dígitos
  const nDPSRaw = digitsOnly(String(dps.nDPS));
  if (!nDPSRaw) throw new Error('nDPS inválido: vazio');
  const ano4 = new Date().getFullYear().toString();
  const num11 = padLeft(nDPSRaw.slice(0, 11), 11);
  const nDPS15 = `${ano4}${num11}`;
  
  // Padrão FIXO XSD (TSIdDPS): DPS + codMun(7) + tpInscr(1) + nrInscr(14) + serie(5) + nDPS(15)
  const id = `DPS${codMun7}${tipoInscr}${prestCnpj14}${serie5}${nDPS15}`;

  // Validações E0004: comprimento e coerência entre ID e campos
  if (id.length !== 45) {
    throw new Error(`TSIdDPS inválido: tamanho ${id.length} diferente de 45`);
  }
  const vServ = dps.servico.valor.toFixed(2);

  const t = dps.tomador;
  const e = dps.tomador.endereco;
  const serie = serieXml; // XML usa valor numérico original (sem padding à esquerda)
  // cTribNac (TSCodTribNac): o XSD exige 6 dígitos. 
  // Regras: 4 dígitos (IISS) -> IISS00. 6 dígitos mantém. Outros comprimentos: erro.
  function normalizeCTribNac(input: string): string {
    const raw = String(input || '').trim();
    const d = raw.replace(/\D+/g, '');
    if (d.length === 6) return d;
    if (d.length === 4) {
      const norm = `${d}00`;
      console.log('[DPS] Normalizando cTribNac 4->6 dígitos:', { original: d, normalizado: norm });
      return norm;
    }
    throw new Error(`Código Tributário Nacional inválido (cTribNac). Informe 4 (IISS) ou 6 (IISSNN) dígitos. Valor recebido: '${input}'`);
  }
  const cTribNac = normalizeCTribNac(dps.servico.codigoTribNac);
  const opSimp = dps.prestadorRegTrib?.opSimpNac ?? 1;
  const regEsp = dps.prestadorRegTrib?.regEspTrib ?? 0;

  // CEP obrigatório em prest.end.endNac (vem do cadastro/prestador configurado)
  const prestCepRaw = (prest.cep || '').toString();
  const prestCep = ensureFixedDigits(prestCepRaw, 8, 'CEP do prestador');
  if (prestCep === '00000000') {
    throw new Error('CEP do prestador inválido: não pode ser 00000000');
  }

  const w = new XmlWriter();
  w.decl('1.0','UTF-8');
  w.open('DPS', { xmlns: 'http://www.sped.fazenda.gov.br/nfse', versao: '1.00' });
  w.open('infDPS', { Id: id });
  // Ambiente exigido: não usar mais naturezaOperacao; exigir tpAmb explícito
  if (!(dps.tpAmb === 1 || dps.tpAmb === 2)) {
    throw new Error('tpAmb inválido ou ausente. Informe 1 (produção) ou 2 (homologação).');
  }
  w.leaf('tpAmb', String(dps.tpAmb));
  w.leaf('dhEmi', dhEmi);
  if (!dps.verAplicDPS || !String(dps.verAplicDPS).trim()) {
    throw new Error('verAplicDPS obrigatório. Informe a versão do aplicativo emissor.');
  }
  w.leaf('verAplic', String(dps.verAplicDPS));
  // Algumas prefeituras exigem 5 dígitos também no campo <serie>
  w.leaf('serie', serie5);
  w.leaf('nDPS', nDPS15);
  w.leaf('dCompet', dps.competencia);
  w.leaf('tpEmit', '1');
  w.leaf('cLocEmi', codMun7);

  // prest
  w.open('prest');
  w.leaf('CNPJ', prestCnpj14);
  const prestIMSan = digitsOnly(prest.im || '');
  if (prestIMSan) w.leaf('IM', prestIMSan);
  w.open('regTrib');
  w.leaf('opSimpNac', String(opSimp));
  w.leaf('regEspTrib', String(regEsp));
  w.close('regTrib');
  w.close('prest');

  // toma
  w.open('toma');
  // Documento do tomador: decidir a tag após normalizar para dígitos
  const tomadorDoc = digitsOnly(t.cpfCnpj);
  if (tomadorDoc.length === 14) {
    w.leaf('CNPJ', tomadorDoc);
  } else if (tomadorDoc.length === 11) {
    w.leaf('CPF', tomadorDoc);
  } else {
    throw new Error(`CPF/CNPJ do tomador inválido: ${tomadorDoc.length} dígitos`);
  }
  w.leaf('xNome', t.razaoSocial);
  w.open('end');
  w.open('endNac');
  const tomadorCodMun7 = ensureFixedDigits(e.codigoMunicipio, 7, 'Código município do tomador');
  const tomadorCep = ensureFixedDigits(String(e.cep), 8, 'CEP do tomador');
  if (tomadorCep === '00000000') {
    throw new Error('CEP do tomador inválido: não pode ser 00000000');
  }
  w.leaf('cMun', tomadorCodMun7);
  w.leaf('CEP', tomadorCep);
  w.close('endNac');
  w.leaf('xLgr', e.logradouro);
  const nroSan = sanitizeText(e.numero || '');
  w.leaf('nro', nroSan);
  if (!nroSan) {
    throw new Error('Número do endereço do tomador obrigatório (campo nro). Preencha para prosseguir.');
  }
  const xCplSan = sanitizeText(e.complemento || '');
  if (xCplSan) w.leaf('xCpl', xCplSan);
  w.leaf('xBairro', e.bairro);
  w.close('end');
  // Tomador: somente emitir fone quando válido; e-mail apenas com conteúdo
  if (t.telefone) {
    const tf = digitsOnly(t.telefone);
    if (tf.length >= 6 && tf.length <= 20) w.leaf('fone', tf);
  }
  if (t.email && t.email.trim().length > 0) {
    w.leaf('email', t.email);
  }  
  w.close('toma');

  // serv
  w.open('serv');
  w.open('locPrest');
  const cLocPrest = dps.locPrestacaoCodigo ? ensureFixedDigits(dps.locPrestacaoCodigo, 7, 'Código do local de prestação') : codMun7;
  w.leaf('cLocPrestacao', cLocPrest);
  w.close('locPrest');
  w.open('cServ');
  w.leaf('cTribNac', cTribNac);
  // cTribMun (municipal) – opcional, mas quando presente deve ter 3 dígitos
  function normalizeCTribMun(input?: string): string | null {
    if (!input) return null;
    const d = input.replace(/\D+/g, '');
    if (!d) return null;
    if (d.length === 3) return d;
    throw new Error(`Código Tributário Municipal inválido (cTribMun). Informe exatamente 3 dígitos. Valor recebido: '${input}'`);
  }
  const cTribMun = normalizeCTribMun(dps.servico.codigoTribMun);
  if (cTribMun) w.leaf('cTribMun', cTribMun);
  w.leaf('xDescServ', dps.servico.discriminacao);
  w.close('cServ');
  
  if (dps.infoComplTemplate && dps.infoComplTemplate.trim().length > 0) {
    const xInf = dps.infoComplTemplate.replace(/\{\{\s*numeroAtendimento\s*\}\}/g, String(dps.numeroAtendimento));
    w.open('infoCompl');
    w.leaf('xInfComp', xInf);
    w.close('infoCompl');
  }
  w.close('serv');

  // valores
  w.open('valores');
  w.open('vServPrest');
  w.leaf('vServ', vServ);
  w.close('vServPrest');
  // w.open('vDescCondIncond');
  // w.leaf('vDescIncond', '0.00');
  // w.leaf('vDescCond', '0.00');
  // w.close('vDescCondIncond');
  // w.open('vDedRed');
  // w.leaf('vDR', '0.00');
  // w.close('vDedRed');

  // Tributação: exigir parâmetros, sem valores fixos
  if (!dps.tributacao) {
    throw new Error('Parâmetros de tributação (tributacao) obrigatórios para montar a DPS.');
  }
  const trib = dps.tributacao;
  if (!([1,2,3,4,5,6] as number[]).includes(trib.tribISSQN as number)) {
    throw new Error('tributacao.tribISSQN inválido. Informe um valor válido conforme o layout (1..6).');
  }
  if (!([1,2,3] as number[]).includes(trib.tpRetISSQN as number)) {
    throw new Error('tributacao.tpRetISSQN inválido. Informe 1, 2 ou 3 conforme layout.');
  }
  w.open('trib');
  w.open('tribMun');
  w.leaf('tribISSQN', String(trib.tribISSQN));
  // Somente emitir tpImunidade quando tribISSQN indicar Imunidade (2)
  if (trib.tribISSQN === 2 && typeof trib.tpImunidade !== 'undefined') {
    w.leaf('tpImunidade', String(trib.tpImunidade));
  }
  w.leaf('tpRetISSQN', String(trib.tpRetISSQN));
  // // pAliq DEVE SER O ÚLTIMO dentro de <tribMun>
  // try {
  //   const aliqNum = Number((dps?.servico as any)?.aliquota);
  //   if (!Number.isNaN(aliqNum) && aliqNum > 0) {
  //     const perc = aliqNum * 100;
  //     // até 4 casas decimais, mantendo 2 por padrão quando aplicável
  //     let pAliq = perc.toFixed(4).replace(/\.?(0{1,2})$/, '');
  //     if (!pAliq.includes('.')) {
  //       pAliq = `${pAliq}.00`;
  //     }
  //     w.leaf('pAliq', pAliq);
  //   }
  // } catch { /* ignore */ }
  w.close('tribMun');
  if (typeof trib.pTotTribFed !== 'undefined' || typeof trib.pTotTribEst !== 'undefined' || typeof trib.pTotTribMun !== 'undefined') {
    w.open('totTrib');
    w.open('pTotTrib');
    if (typeof trib.pTotTribFed !== 'undefined') w.leaf('pTotTribFed', String(trib.pTotTribFed));
    if (typeof trib.pTotTribEst !== 'undefined') w.leaf('pTotTribEst', String(trib.pTotTribEst));
    if (typeof trib.pTotTribMun !== 'undefined') w.leaf('pTotTribMun', String(trib.pTotTribMun));
    w.close('pTotTrib');
    w.close('totTrib');
  }
  w.close('trib');

  w.close('valores');

  w.close('infDPS');
  w.close('DPS');

  return w.build();
}
