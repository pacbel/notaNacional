import type { DpsContext } from "../types";
import { XmlWriter } from "../xml-writer";

export function buildPrestador(w: XmlWriter, context: DpsContext): void {
  w.open("prest");
  w.leaf("CNPJ", context.prestadorCnpj);
  if (context.inscricaoMunicipalPrestador) {
    w.leaf("IM", context.inscricaoMunicipalPrestador);
  }
  if (context.telefonePrestador) {
    w.leaf("fone", context.telefonePrestador);
  }
  if (context.input.prestador.email) {
    w.leaf("email", context.input.prestador.email);
  }
  w.open("regTrib");
  w.leaf("opSimpNac", context.opSimpNac);
  w.leaf("regEspTrib", context.regEspTrib);
  w.close("regTrib");
  w.close("prest");
}
