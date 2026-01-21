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
  
  // Calcular tributos aproximados baseados no valor do serviço
  // Alíquotas aproximadas conforme Lei 12.741/2012
  
  // Tributos Federais (CBS/PIS/COFINS) - aproximadamente 3.5% do valor
  const pTotTribFed = valorServicoNumber * 0.035;
  
  // Tributos Estaduais - geralmente não se aplicam a serviços (0%)
  const pTotTribEst = 0;
  
  // Tributos Municipais (ISSQN) - usar alíquota do serviço se informada
  let pTotTribMun = 0;
  if (context.aliquotaIss) {
    const aliquotaNumber = Number.parseFloat(context.aliquotaIss);
    pTotTribMun = valorServicoNumber * (aliquotaNumber / 100);
  }
  
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
