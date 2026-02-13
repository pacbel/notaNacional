import type { DpsContext } from "../types";
import { XmlWriter } from "../xml-writer";

export function buildIdentificacao(w: XmlWriter, context: DpsContext): void {
  w.leaf("tpAmb", context.tpAmb);
  w.leaf("dhEmi", context.dataEmissao);
  w.leaf("verAplic", context.input.configuracao.verAplic);
  w.leaf("serie", context.serieParaTag);
  w.leaf("nDPS", context.numeroParaTag);
  w.leaf("dCompet", context.competenciaData);
  w.leaf("tpEmit", String(context.input.configuracao.tpEmis));
  w.leaf("cLocEmi", context.codigoMunicipioEmissao);
}
