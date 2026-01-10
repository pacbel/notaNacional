import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/http";
import { servicoUpdateSchema } from "@/lib/validators/servico";
import { servicoSelect, serializeServico } from "../utils";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const servico = await prisma.servico.findUnique({
      where: { id: params.id },
      select: servicoSelect,
    });

    if (!servico) {
      return NextResponse.json({ message: "Serviço não encontrado" }, { status: 404 });
    }

    return NextResponse.json(serializeServico(servico));
  } catch (error) {
    return handleRouteError(error, "Erro ao buscar serviço");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const payload = await request.json().catch(() => null);
    const result = servicoUpdateSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json({ message: "Dados inválidos", issues: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    const updateData: Prisma.ServicoUpdateInput = {};

    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }
    if (data.codigoTributacaoMunicipal !== undefined) {
      updateData.codigoTributacaoMunicipal = data.codigoTributacaoMunicipal;
    }
    if (data.codigoTributacaoNacional !== undefined) {
      updateData.codigoTributacaoNacional = data.codigoTributacaoNacional;
    }
    if (data.codigoNbs !== undefined) {
      updateData.codigoNbs = data.codigoNbs;
    }
    if (data.codigoMunicipioPrestacao !== undefined) {
      updateData.codigoMunicipioPrestacao = data.codigoMunicipioPrestacao;
    }
    if (data.municipioPrestacao !== undefined) {
      updateData.municipioPrestacao = data.municipioPrestacao;
    }
    if (data.informacoesComplementares !== undefined) {
      updateData.informacoesComplementares = data.informacoesComplementares;
    }
    if (data.valorUnitario !== undefined) {
      updateData.valorUnitario = new Prisma.Decimal(data.valorUnitario);
    }
    if (data.aliquotaIss !== undefined) {
      updateData.aliquotaIss = data.aliquotaIss === null ? null : new Prisma.Decimal(data.aliquotaIss);
    }
    if (data.issRetido !== undefined) {
      updateData.issRetido = data.issRetido;
    }
    if (data.ativo !== undefined) {
      updateData.ativo = data.ativo;
    }

    try {
      const servico = await prisma.servico.update({
        where: { id: params.id },
        data: updateData,
        select: servicoSelect,
      });

      return NextResponse.json(serializeServico(servico));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return NextResponse.json({ message: "Serviço não encontrado" }, { status: 404 });
      }

      throw error;
    }
  } catch (error) {
    return handleRouteError(error, "Erro ao atualizar serviço");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const servico = await prisma.servico.update({
      where: { id: params.id },
      data: {
        ativo: false,
      },
      select: servicoSelect,
    });

    return NextResponse.json(serializeServico(servico));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Serviço não encontrado" }, { status: 404 });
    }

    return handleRouteError(error, "Erro ao inativar serviço");
  }
}
