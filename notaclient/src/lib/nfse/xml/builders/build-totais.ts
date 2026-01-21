import type { DpsContext } from "../types";
import { XmlWriter } from "../xml-writer";
import { formatMoney } from "../utils";

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
    if (context.valorIssqn) {
      w.leaf("vISSQN", context.valorIssqn);
    }
  }
  w.close("tribMun");
}

function buildTotTrib(w: XmlWriter, context: DpsContext): void {
  w.open("totTrib");
  
  const valorServicoNumber = Number.parseFloat(context.valorServico);
  
  // Usar os percentuais configurados nas configurações do sistema
  const pTotTribFedPercent = context.input.configuracao.pTotTribFed ?? 0;
  const pTotTribEstPercent = context.input.configuracao.pTotTribEst ?? 0;
  const pTotTribMunPercent = context.input.configuracao.pTotTribMun ?? 0;
  
  // Calcular valores monetários baseados nos percentuais configurados
  const pTotTribFed = valorServicoNumber * (pTotTribFedPercent / 100);
  const pTotTribEst = valorServicoNumber * (pTotTribEstPercent / 100);
  const pTotTribMun = valorServicoNumber * (pTotTribMunPercent / 100);
  
  // pTotTrib é um GRUPO COMPOSTO (CG) - obrigatório 1-1
  // Deve conter os 3 valores monetários obrigatórios
  w.open("pTotTrib");
  w.leaf("pTotTribFed", formatMoney(pTotTribFed));
  w.leaf("pTotTribEst", formatMoney(pTotTribEst));
  w.leaf("pTotTribMun", formatMoney(pTotTribMun));
  w.close("pTotTrib");
  
  w.close("totTrib");
}

export function buildTotais(w: XmlWriter, context: DpsContext): void {
  w.open("valores");
  w.open("vServPrest");
  w.leaf("vServ", context.valorServico);
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
