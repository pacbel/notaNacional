import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { prisma } from '@/lib/prisma';

// Retorna o ambiente de emissão de NFe do prestador logado
// 1 = Produção, 2 = Homologação
export async function GET(request: NextRequest) {
  try {
    const user = await getTokenData(request);
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Não autorizado' }, { status: 200 });
    }
    const prestador = await prisma.prestador.findUnique({ where: { id: user.prestadorId } });
    if (!prestador) {
      return NextResponse.json({ ok: false, message: 'Prestador não encontrado' }, { status: 200 });
    }
    const ambiente = prestador.nfeAmbiente ?? 2;
    return NextResponse.json({ ok: true, ambiente, atualizadoEm: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: 'Falha ao obter ambiente', error: String(error?.message ?? error) }, { status: 200 });
  }
}
