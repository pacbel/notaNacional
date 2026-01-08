import { NextRequest, NextResponse } from 'next/server';
import { processarRetornoNfse } from '@/lib/processarRetornoNfse';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[API:ProcessarRetorno] Recebendo requisição...');
    const { notaFiscalId, xmlRetorno } = await request.json();
    console.log('[API:ProcessarRetorno] Dados recebidos:', { notaFiscalId, xmlRetornoLength: xmlRetorno?.length });
    
    if (!notaFiscalId || !xmlRetorno) {
      console.log('[API:ProcessarRetorno] Parâmetros inválidos');
      return NextResponse.json(
        { error: 'ID da nota fiscal e XML de retorno são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('[API:ProcessarRetorno] Processando retorno da NFSe...');
    const resultadoProcessamento = await processarRetornoNfse(notaFiscalId, xmlRetorno);
    console.log('[API:ProcessarRetorno] Retorno da NFSe processado:', resultadoProcessamento);

    // Verificar se o processamento foi bem-sucedido e a nota foi marcada como autorizada
    const notaProcessada = await prisma.notafiscal.findUnique({
      where: { id: notaFiscalId },
      select: { status: true }
    });

    if (notaProcessada && notaProcessada.status === '1') {
      console.log(`[API:ProcessarRetorno] Nota fiscal ${notaFiscalId} confirmada como autorizada. Chamando endpoint de autorização final...`);

      const baseUrl = new URL(request.url).origin;
      const autorizaUrl = `${baseUrl}/api/nfse/autoriza-nfse`;

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        headers.set('Cookie', cookieHeader);
      }

      try {
        const autorizaResponse = await fetch(autorizaUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ notaFiscalId }),
        });

        const autorizaData = await autorizaResponse.json();

        if (!autorizaResponse.ok || !autorizaData.success) {
          console.error(`[API:ProcessarRetorno] Falha ao chamar /api/nfse/autoriza-nfse para ${notaFiscalId}:`, autorizaData);
          // Retorna o resultado do processamento original com um aviso
          return NextResponse.json({
            data: resultadoProcessamento,
            warning: 'Retorno da NFSe processado, mas houve um problema na etapa final de autorização e incremento do RPS.',
            autorizaError: autorizaData
          });
        }
        console.log(`[API:ProcessarRetorno] Endpoint /api/nfse/autoriza-nfse chamado com sucesso para ${notaFiscalId}. RPS deve ter sido incrementado.`);
      } catch (authError) {
        console.error(`[API:ProcessarRetorno] Erro ao tentar chamar /api/nfse/autoriza-nfse para ${notaFiscalId}:`, authError);
        return NextResponse.json({
          data: resultadoProcessamento,
          warning: 'Retorno da NFSe processado, mas ocorreu um erro ao tentar chamar a etapa final de autorização.',
          autorizaError: authError instanceof Error ? authError.message : String(authError)
        });
      }
    } else {
      console.log(`[API:ProcessarRetorno] Nota fiscal ${notaFiscalId} não está com status 'Autorizada' (status: ${notaProcessada?.status}) após processamento do retorno. Não chamará autoriza-nfse.`);
    }

    return NextResponse.json({ data: resultadoProcessamento });
  } catch (error) {
    console.error('[API:ProcessarRetorno] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao processar retorno da NFSe', details: errorMessage },
      { status: 500 }
    );
  }
}
