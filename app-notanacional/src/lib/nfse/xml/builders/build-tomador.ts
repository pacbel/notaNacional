import type { DpsContext, TomadorBase } from "../types";
import { XmlWriter } from "../xml-writer";

export function buildTomador(w: XmlWriter, context: DpsContext): void {
  const tomador = context.input.tomador;
  if (!tomador) {
    return;
  }

  w.open("toma");
  switch (context.tomadorTipo) {
    case "ESTRANGEIRO":
      buildTomadorEstrangeiro(w, context, tomador);
      break;
    case "ANONIMO":
      buildTomadorAnonimo(w, context, tomador);
      break;
    default:
      buildTomadorNacional(w, context, tomador);
      break;
  }
  w.close("toma");
}

function buildTomadorNacional(w: XmlWriter, context: DpsContext, tomador: TomadorBase): void {
  if (context.tomadorDocumentoTag && context.tomadorDocumento) {
    w.leaf(context.tomadorDocumentoTag, context.tomadorDocumento);
  }
  buildTomadorDadosComplementares(w, context, tomador);
}

function buildTomadorEstrangeiro(w: XmlWriter, context: DpsContext, tomador: TomadorBase): void {
  const documento = context.tomadorDocumento ?? tomador.documento ?? undefined;
  if (documento) {
    w.leaf("idEstrangeiro", documento);
  }
  buildTomadorDadosComplementares(w, context, tomador);
}

function buildTomadorAnonimo(w: XmlWriter, context: DpsContext, tomador: TomadorBase): void {
  buildTomadorDadosComplementares(w, context, tomador);
}

function buildTomadorDadosComplementares(w: XmlWriter, context: DpsContext, tomador: TomadorBase): void {
  w.leaf("xNome", tomador.nomeRazaoSocial);
  buildTomadorEndereco(w, context, tomador);
  if (context.tomadorTelefone) {
    w.leaf("fone", context.tomadorTelefone);
  }
  if (tomador.email) {
    w.leaf("email", tomador.email);
  }
}

function buildTomadorEndereco(w: XmlWriter, context: DpsContext, tomador: TomadorBase): void {
  const dados = tomador;

  const hasEnderecoNacional = Boolean(
    dados.logradouro ||
    dados.numero ||
    dados.complemento ||
    dados.bairro ||
    context.tomadorCodigoMunicipio ||
    context.tomadorCep
  );

  const hasEnderecoExterior = context.tomadorTipo === "ESTRANGEIRO" && Boolean(
    dados.codigoPais ||
    dados.codigoPostalExterior ||
    dados.cidadeExterior ||
    dados.estadoExterior ||
    dados.logradouro ||
    dados.numero ||
    dados.complemento ||
    dados.bairro
  );

  if (!hasEnderecoNacional && !hasEnderecoExterior) {
    return;
  }

  w.open("end");

  if (hasEnderecoNacional) {
    w.open("endNac");
    if (context.tomadorCodigoMunicipio) {
      w.leaf("cMun", context.tomadorCodigoMunicipio);
    }
    if (context.tomadorCep) {
      w.leaf("CEP", context.tomadorCep);
    }    
    w.close("endNac");
        
    if (dados.logradouro) {
      w.leaf("xLgr", dados.logradouro);
    }
    if (dados.numero) {
      w.leaf("nro", dados.numero);
    }
    if (dados.complemento) {
      w.leaf("xCpl", dados.complemento);
    }
    if (dados.bairro) {
      w.leaf("xBairro", dados.bairro);
    }
  }

  if (hasEnderecoExterior) {
    w.open("endExt");
    if (dados.codigoPais) {
      w.leaf("cPais", dados.codigoPais);
    }
    if (dados.codigoPostalExterior) {
      w.leaf("cEndPost", dados.codigoPostalExterior);
    }
    if (dados.cidadeExterior) {
      w.leaf("xCidade", dados.cidadeExterior);
    }
    if (dados.estadoExterior) {
      w.leaf("xEstProvReg", dados.estadoExterior);
    }
    if (dados.logradouro) {
      w.leaf("xLgr", dados.logradouro);
    }
    if (dados.numero) {
      w.leaf("nro", dados.numero);
    }
    if (dados.complemento) {
      w.leaf("xCpl", dados.complemento);
    }
    if (dados.bairro) {
      w.leaf("xBairro", dados.bairro);
    }
    w.close("endExt");
  }

  w.close("end");
}
