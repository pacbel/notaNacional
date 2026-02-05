import type { DpsContext } from "../types";
import { XmlWriter } from "../xml-writer";

export function buildServico(w: XmlWriter, context: DpsContext): void {
  switch (context.servicoTipo) {
    case "EXPORTACAO":
      buildServicoExportacao(w, context);
      break;
    case "CONSTRUCAO":
      buildServicoConstrucao(w, context);
      break;
    default:
      buildServicoNormal(w, context);
      break;
  }
}

function buildServicoNormal(w: XmlWriter, context: DpsContext): void {
  buildServicoSkeleton(w, context, () => {
    // Serviço normal não adiciona grupos complementares
  });
}

function buildServicoExportacao(w: XmlWriter, context: DpsContext): void {
  buildServicoSkeleton(w, context, () => {
    const exportacao = context.input.servico.exportacao;
    if (!exportacao) {
      return;
    }

    w.open("exportacao");
    if (exportacao.paisDestino) {
      w.leaf("paisDest", exportacao.paisDestino);
    }
    if (exportacao.justificativa) {
      w.leaf("xJust", exportacao.justificativa);
    }
    w.close("exportacao");
  });
}

function buildServicoConstrucao(w: XmlWriter, context: DpsContext): void {
  buildServicoSkeleton(w, context, () => {
    const construcao = context.input.servico.construcao;
    if (!construcao) {
      return;
    }

    w.open("obra");
    if (construcao.codigoObra) {
      w.leaf("cObra", construcao.codigoObra);
    }
    if (construcao.codigoArt) {
      w.leaf("cArt", construcao.codigoArt);
    }
    w.close("obra");
  });
}

function buildServicoSkeleton(w: XmlWriter, context: DpsContext, extra: () => void): void {
  w.open("serv");
  buildServicoBase(w, context);
  extra();
  w.close("serv");
}

function buildServicoBase(w: XmlWriter, context: DpsContext): void {
  w.open("locPrest");
  w.leaf("cLocPrestacao", context.codigoMunicipioPrestacao);
  w.close("locPrest");

  w.open("cServ");
  w.leaf("cTribNac", context.codigoTributacaoNacional);
  const codigoTribMunRaw = context.input.servico.codigoTributacaoMunicipal;
  const codigoTribMun = codigoTribMunRaw == null ? "" : String(codigoTribMunRaw).trim();
  const isCodigoTribMunZero = codigoTribMun !== "" && Number(codigoTribMun) === 0;

  if (codigoTribMun !== "" && !isCodigoTribMunZero) {
    w.leaf("cTribMun", codigoTribMun);
  }
  w.leaf("xDescServ", context.serviceDescription);
  w.leaf("cNBS", context.codigoNbs);
  if (context.codigoInternoContribuinte) {
    w.leaf("cIntContrib", context.codigoInternoContribuinte);
  }
  w.close("cServ");

  if (context.informacoesComplementares) {
    w.open("infoCompl");
    w.leaf("xInfComp", context.informacoesComplementares);
    w.close("infoCompl");
  }
}
