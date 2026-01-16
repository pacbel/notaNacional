import { NextResponse } from "next/server";
import { Ambiente, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { configuracaoUpdateSchema } from "@/lib/validators/configuracao";
import { getCurrentUser } from "@/lib/auth";

function mapConfiguracaoToDto(configuracao: Prisma.ConfiguracaoDpsGetPayload<{}>) {
  const numeroInicialDps = (configuracao as typeof configuracao & { numeroInicialDps?: number }).numeroInicialDps ?? 1;

  return {
    nomeSistema: configuracao.nomeSistema,
    versaoAplicacao: configuracao.versaoAplicacao,
    ambientePadrao: configuracao.ambientePadrao,
    seriePadrao: configuracao.seriePadrao,
    numeroInicialDps,
    verAplic: configuracao.verAplic,
    emailRemetente: configuracao.emailRemetente,
    robotClientId: configuracao.robotClientId,
    robotClientSecret: configuracao.robotClientSecret,
    robotTokenCacheMinutos: configuracao.robotTokenCacheMinutos,
    mfaCodigoExpiracaoMinutos: configuracao.mfaCodigoExpiracaoMinutos,
    enviarNotificacaoEmailPrestador: configuracao.enviarNotificacaoEmailPrestador,
    ativo: configuracao.ativo,
    xLocEmi: configuracao.xLocEmi,
    xLocPrestacao: configuracao.xLocPrestacao,
    nNFSe: configuracao.nNFSe,
    xTribNac: configuracao.xTribNac,
    xNBS: configuracao.xNBS,
    ambGer: configuracao.ambGer,
    tpEmis: configuracao.tpEmis,
    procEmi: configuracao.procEmi,
    cStat: configuracao.cStat,
    dhProc: configuracao.dhProc?.toISOString() ?? null,
    nDFSe: configuracao.nDFSe ?? "",
    tribMun: {
      tribISSQN: configuracao.tribISSQN,
      tpImunidade: configuracao.tpImunidade,
      tpRetISSQN: configuracao.tpRetISSQN,
    },
    totTrib: {
      pTotTribFed: configuracao.pTotTribFed,
      pTotTribEst: configuracao.pTotTribEst,
      pTotTribMun: configuracao.pTotTribMun,
    },
  };
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }

    let configuracao = await prisma.configuracaoDps.findUnique({
      where: { prestadorId: currentUser.prestadorId },
    });

    // Se não existir, criar configuração padrão para o prestador
    if (!configuracao) {
      configuracao = await prisma.configuracaoDps.create({
        data: {
          prestadorId: currentUser.prestadorId,
          nomeSistema: "NotaClient",
          versaoAplicacao: "1.0.0",
          verAplic: "1.0.0",
          xLocEmi: "1",
          xLocPrestacao: "1",
          nNFSe: "1",
          xTribNac: "01.07.00",
          xNBS: "1.0101.10.00",
        },
      });
    }

    return NextResponse.json(mapConfiguracaoToDto(configuracao));
  } catch (error) {
    return handleRouteError(error, "Erro ao carregar configuração");
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
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
      verAplic: data.verAplic,
      emailRemetente: data.emailRemetente,
      robotClientId: data.robotClientId,
      robotClientSecret: data.robotClientSecret,
      robotTokenCacheMinutos: data.robotTokenCacheMinutos,
      mfaCodigoExpiracaoMinutos: data.mfaCodigoExpiracaoMinutos,
      enviarNotificacaoEmailPrestador: data.enviarNotificacaoEmailPrestador,
      ativo: data.ativo,
      xLocEmi: data.xLocEmi,
      xLocPrestacao: data.xLocPrestacao,
      nNFSe: data.nNFSe,
      xTribNac: data.xTribNac,
      xNBS: data.xNBS,
      ambGer: data.ambGer,
      tpEmis: data.tpEmis,
      procEmi: data.procEmi,
      cStat: data.cStat,
      dhProc: data.dhProc ? new Date(data.dhProc) : null,
      nDFSe: data.nDFSe,
      tribISSQN: data.tribMun.tribISSQN,
      tpImunidade: data.tribMun.tpImunidade,
      tpRetISSQN: data.tribMun.tpRetISSQN,
      pTotTribFed: data.totTrib.pTotTribFed ?? undefined,
      pTotTribEst: data.totTrib.pTotTribEst ?? undefined,
      pTotTribMun: data.totTrib.pTotTribMun ?? undefined,
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

    const responseDto = {
      ...mapConfiguracaoToDto(response),
      updatedAt: response.updatedAt.toISOString(),
    };

    return NextResponse.json(responseDto);
  } catch (error) {
    return handleRouteError(error, "Erro ao atualizar configuração");
  }
}
