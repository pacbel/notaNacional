import type { DpsContext } from "../types";
import { XmlWriter } from "../xml-writer";
import { formatMoney, formatPercentage } from "../utils";
import { Prisma } from "@prisma/client";

interface TributacaoMunicipalOptions {
  includeAliquota: boolean;
  includeImunidade: boolean;
}

function writeTributacaoMunicipal(w: XmlWriter, context: DpsContext, options: TributacaoMunicipalOptions): void {
  w.open("tribMun");
  w.leaf("tribISSQN", context.tribIssqn);
  if (options.includeImunidade && context.tpImunidade) {
    w.leaf("tpImunidade", context.tpImunidade);
  }
  w.leaf("tpRetISSQN", context.tpRetIssqn);
  if (options.includeAliquota && context.aliquotaIss) {
    w.leaf("pAliq", context.aliquotaIss);
  }
  w.close("tribMun");
}

function buildTotTrib(w: XmlWriter, context: DpsContext): void {
  w.open("totTrib");
  
  // Emitir percentuais exatamente como configurados no banco (sem cálculo)
  const pTotTribFedPercent = context.input.configuracao.pTotTribFed ?? 0;
  const pTotTribEstPercent = context.input.configuracao.pTotTribEst ?? 0;
  const pTotTribMunPercent = context.input.configuracao.pTotTribMun ?? 0;
  
  w.open("pTotTrib");
  w.leaf("pTotTribFed", formatPercentage(pTotTribFedPercent));
  w.leaf("pTotTribEst", formatPercentage(pTotTribEstPercent));
  w.leaf("pTotTribMun", formatPercentage(pTotTribMunPercent));
  w.close("pTotTrib");
  
  w.close("totTrib");
}

export function buildTotais(w: XmlWriter, context: DpsContext): void {
  w.open("valores");
  w.open("vServPrest");
  const vServRaw = context.input.servico.valorUnitario as unknown;
  const vServNumber = vServRaw instanceof Prisma.Decimal
    ? vServRaw.toNumber()
    : Number(vServRaw);
  w.leaf("vServ", formatMoney(vServNumber));
  w.close("vServPrest");
  w.open("trib");
  writeTributacaoMunicipal(w, context, {
    includeAliquota: context.shouldInformAliquota,
    includeImunidade: context.shouldInformImunidade && Boolean(context.tpImunidade),
  });
  buildTotTrib(w, context);
  w.close("trib");
  w.close("valores");
}
