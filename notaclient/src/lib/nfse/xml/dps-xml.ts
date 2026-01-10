import { Prisma, type TipoDocumento } from "@prisma/client";

export interface PartyBase {
  cnpj: string;
  codigoMunicipio: string;
}

export interface TomadorBase {
  tipoDocumento: TipoDocumento | "CPF" | "CNPJ";
  documento: string;
  nomeRazaoSocial: string;
  codigoMunicipio: string;
  logradouro: string;
  numero: string;
  bairro: string;
  complemento?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface ServicoBase {
  descricao: string;
  valorUnitario: Prisma.Decimal | number;
  codigoTributacaoMunicipal: string;
  codigoTributacaoNacional: string;
  codigoNbs?: string | null;
  codigoMunicipioPrestacao: string;
  informacoesComplementares?: string | null;
}

export interface ConfiguracaoBase {
  ambGer: number | null;
  verAplic: string;
  tpEmis: number;
  tribISSQN: number;
  tpImunidade: number;
  tpRetISSQN: number;
  pTotTribFed: Prisma.Decimal | number;
  pTotTribEst: Prisma.Decimal | number;
  pTotTribMun: Prisma.Decimal | number;
}

export interface GenerateDpsXmlInput {
  identificador: string;
  numero: number;
  serie: number;
  competencia: Date;
  emissao: Date;
  prestador: PartyBase;
  tomador: TomadorBase;
  servico: ServicoBase;
  configuracao: ConfiguracaoBase;
  observacoes?: string | null;
}

export function generateDpsXml(input: GenerateDpsXmlInput): string {
  const infDpsId = resolveInfDpsId(input);
  const competenciaData = formatDate(input.competencia);
  const dataEmissao = formatDateTimeOffset(input.emissao);
  const documentoTomadorTag = input.tomador.tipoDocumento === "CNPJ" ? "CNPJ" : "CPF";
  const telefoneTomador = normalizeDigits(input.tomador.telefone);
  const cepTomador = normalizeDigits(input.tomador.cep);
  const valorServico = formatMoney(input.servico.valorUnitario);
  const totalTribFederal = formatMoney(input.configuracao.pTotTribFed ?? 0);
  const totalTribEstadual = formatMoney(input.configuracao.pTotTribEst ?? 0);
  const totalTribMunicipal = formatMoney(input.configuracao.pTotTribMun ?? 0);
  const informacoesComplementares =
    input.observacoes ?? input.servico.informacoesComplementares ?? "";

  const lines: (string | null)[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<DPS versao="1.01">',
    `  <infDPS Id="${escapeXml(infDpsId)}">`,
    `    <tpAmb>${input.configuracao.ambGer ?? 2}</tpAmb>`,
    `    <dhEmi>${escapeXml(dataEmissao)}</dhEmi>`,
    `    <verAplic>${escapeXml(input.configuracao.verAplic)}</verAplic>`,
    `    <serie>${input.serie}</serie>`,
    `    <nDPS>${input.numero}</nDPS>`,
    `    <dCompet>${competenciaData}</dCompet>`,
    `    <tpEmit>${input.configuracao.tpEmis}</tpEmit>`,
    `    <cLocEmi>${escapeXml(input.prestador.codigoMunicipio)}</cLocEmi>`,
    "    <prest>",
    `      <CNPJ>${escapeXml(input.prestador.cnpj)}</CNPJ>`,
    "      <regTrib>",
    "        <opSimpNac>1</opSimpNac>",
    "        <regEspTrib>0</regEspTrib>",
    "      </regTrib>",
    "    </prest>",
    "    <toma>",
    `      <${documentoTomadorTag}>${escapeXml(input.tomador.documento)}</${documentoTomadorTag}>`,
    `      <xNome>${escapeXml(input.tomador.nomeRazaoSocial)}</xNome>`,
    "      <end>",
    "        <endNac>",
    `          <cMun>${escapeXml(input.tomador.codigoMunicipio)}</cMun>`,
    cepTomador ? `          <CEP>${cepTomador}</CEP>` : null,
    "        </endNac>",
    `        <xLgr>${escapeXml(input.tomador.logradouro)}</xLgr>`,
    `        <nro>${escapeXml(input.tomador.numero)}</nro>`,
    input.tomador.complemento ? `        <xCpl>${escapeXml(input.tomador.complemento)}</xCpl>` : null,
    `        <xBairro>${escapeXml(input.tomador.bairro)}</xBairro>`,
    "      </end>",
    telefoneTomador ? `      <fone>${telefoneTomador}</fone>` : null,
    input.tomador.email ? `      <email>${escapeXml(input.tomador.email)}</email>` : null,
    "    </toma>",
    "    <serv>",
    "      <locPrest>",
    `        <cLocPrestacao>${escapeXml(input.servico.codigoMunicipioPrestacao)}</cLocPrestacao>`,
    "      </locPrest>",
    "      <cServ>",
    `        <cTribNac>${escapeXml(input.servico.codigoTributacaoNacional)}</cTribNac>`,
    `        <cTribMun>${escapeXml(input.servico.codigoTributacaoMunicipal)}</cTribMun>`,
    `        <xDescServ>${escapeXml(input.servico.descricao)}</xDescServ>`,
    input.servico.codigoNbs ? `        <cNBS>${escapeXml(input.servico.codigoNbs)}</cNBS>` : null,
    "      </cServ>",
    "      <infoCompl>",
    `        <xInfComp>${escapeXml(informacoesComplementares)}</xInfComp>`,
    "      </infoCompl>",
    "    </serv>",
    "    <valores>",
    "      <vServPrest>",
    `        <vServ>${valorServico}</vServ>`,
    "      </vServPrest>",
    "      <trib>",
    "        <tribMun>",
    `          <tribISSQN>${input.configuracao.tribISSQN}</tribISSQN>`,
    `          <tpImunidade>${input.configuracao.tpImunidade}</tpImunidade>`,
    `          <tpRetISSQN>${input.configuracao.tpRetISSQN}</tpRetISSQN>`,
    "        </tribMun>",
    "        <totTrib>",
    "          <pTotTrib>",
    `            <pTotTribFed>${totalTribFederal}</pTotTribFed>`,
    `            <pTotTribEst>${totalTribEstadual}</pTotTribEst>`,
    `            <pTotTribMun>${totalTribMunicipal}</pTotTribMun>`,
    "          </pTotTrib>",
    "        </totTrib>",
    "      </trib>",
    "    </valores>",
    "  </infDPS>",
    "</DPS>",
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function resolveInfDpsId(input: GenerateDpsXmlInput): string {
  if (input.identificador?.startsWith("DPS")) {
    return input.identificador;
  }

  const serie = String(input.serie).padStart(3, "0");
  const numero = String(input.numero).padStart(6, "0");
  const ano = input.competencia.getFullYear();
  const mes = String(input.competencia.getMonth() + 1).padStart(2, "0");
  const dia = String(input.competencia.getDate()).padStart(2, "0");

  return `DPS${input.prestador.codigoMunicipio}${input.prestador.cnpj}${serie}${numero}${ano}${mes}${dia}`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeOffset(date: Date): string {
  const timezoneOffset = date.getTimezoneOffset();
  const sign = timezoneOffset > 0 ? "-" : "+";
  const absoluteOffset = Math.abs(timezoneOffset);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const minutes = String(absoluteOffset % 60).padStart(2, "0");
  const adjusted = new Date(date.getTime() - timezoneOffset * 60000);

  return `${adjusted.toISOString().slice(0, 19)}${sign}${hours}:${minutes}`;
}

function formatMoney(value: Prisma.Decimal | number): string {
  const numeric = value instanceof Prisma.Decimal ? value.toNumber() : value;
  return numeric.toFixed(2);
}

function escapeXml(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeDigits(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  return digits || null;
}
