import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Ambiente, Prisma } from "@prisma/client";
import { configuracaoUpdateSchema, type ConfiguracaoDto } from "@/lib/validators/configuracao";
import { canAccessConfiguracoes } from "@/lib/permissions";
import { clearRobotCredentialsCache } from "@/lib/notanacional-api";

function mapConfiguracaoToDto(configuracao: Prisma.ConfiguracaoDpsGetPayload<{}>) {
  const numeroInicialDps = (configuracao as typeof configuracao & { numeroInicialDps?: number }).numeroInicialDps ?? 1;

  return {
    nomeSistema: configuracao.nomeSistema,
    versaoAplicacao: configuracao.versaoAplicacao,
    ambientePadrao: configuracao.ambientePadrao,
    seriePadrao: configuracao.seriePadrao,
    numeroInicialDps,
    emailRemetente: configuracao.emailRemetente,
    robotClientId: configuracao.robotClientId,
    robotClientSecret: configuracao.robotClientSecret,
    robotTokenCacheMinutos: configuracao.robotTokenCacheMinutos,
    mfaCodigoExpiracaoMinutos: configuracao.mfaCodigoExpiracaoMinutos,
    enviarNotificacaoEmailPrestador: configuracao.enviarNotificacaoEmailPrestador,
    ativo: configuracao.ativo,
    xLocEmi: configuracao.xLocEmi,
    xLocPrestacao: configuracao.xLocPrestacao,
    tpAmb: configuracao.tpAmb,
    opSimpNac: configuracao.opSimpNac,
    regEspTrib: configuracao.regEspTrib,
    ambGer: configuracao.ambGer,
    tpEmis: configuracao.tpEmis,
    procEmi: configuracao.procEmi,
    cStat: configuracao.cStat,
    dhProc: configuracao.dhProc?.toISOString() ?? null,
    tribMun: {
      tribISSQN: configuracao.tribISSQN,
      tpImunidade: configuracao.tpImunidade,
      tpRetISSQN: configuracao.tpRetISSQN,
    },
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissão
    if (!canAccessConfiguracoes(currentUser.role)) {
      return NextResponse.json(
        { message: "Acesso negado. Apenas usuários com perfil Gestão podem acessar." },
        { status: 403 }
      );
    }

    console.log("[Configuracoes] Buscando configuração para prestadorId:", currentUser.prestadorId);

    let configuracao = await prisma.configuracaoDps.findUnique({
      where: { prestadorId: currentUser.prestadorId },
    });

    console.log("[Configuracoes] Configuração encontrada:", configuracao ? "SIM" : "NÃO");

    // Se não existir, criar configuração padrão para o prestador
    if (!configuracao) {
      console.log("[Configuracoes] Criando configuração padrão para prestadorId:", currentUser.prestadorId);

      configuracao = await prisma.configuracaoDps.create({
        data: {
          prestadorId: currentUser.prestadorId,
          nomeSistema: "NotaClient",
          versaoAplicacao: "1.0.0",
          xLocEmi: "1",
          xLocPrestacao: "1",
          xTribNac: "01.07.00",
          xNBS: "1.0101.10.00",
          tpAmb: 2,
          opSimpNac: 1,
          regEspTrib: 0,
          tribISSQN: 1,
          tpImunidade: 0,
          tpRetISSQN: 1,
        },
      });
      
      console.log("[Configuracoes] Configuração criada com sucesso!");
    }

    return NextResponse.json(mapConfiguracaoToDto(configuracao));
  } catch (error) {
    console.error("[Configuracoes] Erro detalhado:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao carregar configuração" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    // Verificar permissão
    if (!canAccessConfiguracoes(currentUser.role)) {
      return NextResponse.json(
        { message: "Acesso negado. Apenas usuários com perfil Gestão podem acessar." },
        { status: 403 }
      );
    }

    const payload = await request.json().catch(() => null);
    const parseResult = configuracaoUpdateSchema.safeParse(payload);

    if (!parseResult.success) {
      return NextResponse.json({
        message: "Dados inválidos",
        issues: parseResult.error.format(),
      }, { status: 400 });
    }

    const data = parseResult.data;

    const updateData: Prisma.ConfiguracaoDpsUpdateInput = {
      nomeSistema: data.nomeSistema,
      versaoAplicacao: data.versaoAplicacao,
      ambientePadrao: data.ambientePadrao as Ambiente,
      seriePadrao: data.seriePadrao,
      numeroInicialDps: data.numeroInicialDps,
      emailRemetente: data.emailRemetente,
      robotClientId: data.robotClientId,
      robotClientSecret: data.robotClientSecret,
      robotTokenCacheMinutos: data.robotTokenCacheMinutos,
      mfaCodigoExpiracaoMinutos: data.mfaCodigoExpiracaoMinutos,
      enviarNotificacaoEmailPrestador: data.enviarNotificacaoEmailPrestador,
      ativo: data.ativo,
      xLocEmi: data.xLocEmi,
      xLocPrestacao: data.xLocPrestacao,
      tpAmb: data.tpAmb,
      opSimpNac: data.opSimpNac,
      regEspTrib: data.regEspTrib,
      ambGer: data.ambGer,
      tpEmis: data.tpEmis,
      procEmi: data.procEmi,
      cStat: data.cStat,
      dhProc: data.dhProc ? new Date(data.dhProc) : null,
      tribISSQN: data.tribMun.tribISSQN,
      tpImunidade: data.tribMun.tpImunidade,
      tpRetISSQN: data.tribMun.tpRetISSQN,
    };

    // Buscar ou criar configuração do prestador
    const existing = await prisma.configuracaoDps.findUnique({
      where: { prestadorId: currentUser.prestadorId },
    });

    const response = existing
      ? await prisma.configuracaoDps.update({
          where: { prestadorId: currentUser.prestadorId },
          data: updateData,
        })
      : await prisma.configuracaoDps.create({
          data: {
            prestadorId: currentUser.prestadorId,
            ...updateData,
          } as Prisma.ConfiguracaoDpsCreateInput,
        });

    clearRobotCredentialsCache(currentUser.prestadorId);

    const responseDto = {
      ...mapConfiguracaoToDto(response),
      updatedAt: response.updatedAt.toISOString(),
    };

    return NextResponse.json(responseDto);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao atualizar configuração" },
      { status: 500 }
    );
  }
}
