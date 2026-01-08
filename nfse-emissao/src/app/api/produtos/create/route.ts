import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenData } from '@/services/authService';
import { logService } from '@/services/logService';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const userData = await getTokenData(request);
    if (!userData) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();

    const parseMoney = (v: FormDataEntryValue | null) => {
      if (!v) return 0;
      const s = String(v).replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    };

    const produtoData = {
      id: randomUUID(),
      codigo: (formData.get('codigo') as string) || '',
      codigoBarras: (formData.get('codigoBarras') as string) || null,
      descricao: (formData.get('descricao') as string) || '',
      ncm: (formData.get('ncm') as string) || null,
      cfop: (formData.get('cfop') as string) || null,
      unComercial: (formData.get('unComercial') as string) || null,
      unTributaria: (formData.get('unTributaria') as string) || null,
      qtdComercial: formData.get('qtdComercial') ? Number(formData.get('qtdComercial')) : 1,
      qtdTributaria: formData.get('qtdTributaria') ? Number(formData.get('qtdTributaria')) : 1,
      precoVenda: parseMoney(formData.get('precoVenda')),
      informacoesAdicionais: (formData.get('informacoesAdicionais') as string) || null,
      crt: (formData.get('crt') as string) || null,
      // ICMS
      icmsCodigo: (formData.get('icmsCodigo') as string) || null,
      icmsOrigem: (formData.get('icmsOrigem') as string) || null,
      icmsAliquota: parseMoney(formData.get('icmsAliquota')) / 100,
      // IPI
      ipiCst: (formData.get('ipiCst') as string) || null,
      ipiClasseEnquadramento: (formData.get('ipiClasseEnquadramento') as string) || null,
      ipiCodigoEnquadramento: (formData.get('ipiCodigoEnquadramento') as string) || null,
      ipiCnpjProdutor: (formData.get('ipiCnpjProdutor') as string) || null,
      ipiQtdeSelo: formData.get('ipiQtdeSelo') ? Number(formData.get('ipiQtdeSelo')) : null,
      ipiAliquota: parseMoney(formData.get('ipiAliquota')) / 100,
      // PIS
      pisCst: (formData.get('pisCst') as string) || null,
      pisAliquota: parseMoney(formData.get('pisAliquota')) / 100,
      pisStAliquota: parseMoney(formData.get('pisStAliquota')) / 100,
      // COFINS
      cofinsCst: (formData.get('cofinsCst') as string) || null,
      cofinsAliquota: parseMoney(formData.get('cofinsAliquota')) / 100,
      cofinsStAliquota: parseMoney(formData.get('cofinsStAliquota')) / 100,
      // OUTROS
      cest: (formData.get('cest') as string) || null,
      escala: (formData.get('escala') as string) || null,
      cnpjFabricante: (formData.get('cnpjFabricante') as string) || null,
      codigoBeneficioFiscal: (formData.get('codigoBeneficioFiscal') as string) || null,
    } as any;

    const produto = await prisma.produto.create({ data: produtoData });

    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Criar',
      entidade: 'Produto',
      entidadeId: produto.id,
      descricao: `Usuário ${userData.nome} criou o produto ${produto.codigo} - ${produto.descricao}`,
      tela: 'Produtos',
    });

    const host = request.headers.get('host') || 'app.nfsebh.com.br';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://${host}/produtos`);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
