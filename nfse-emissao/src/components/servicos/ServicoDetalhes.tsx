'use client';

import { formatarNumero } from '@/utils/formatters';
import { Servico } from '@/types/servico';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ServicoDetalhesProps {
  servico: Servico;
}

export default function ServicoDetalhes({ servico }: ServicoDetalhesProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <CardTitle className="text-lg sm:text-xl">Informações do Serviço</CardTitle>
            <Badge variant={servico.ativo ? 'default' : 'destructive'}>
              {servico.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700">Descrição</h3>
              <p className="text-sm sm:text-base text-gray-900">{servico.descricao}</p>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700">Valor Unitário</h3>
              <p className="text-sm sm:text-base text-gray-900 font-medium">
                {formatarNumero(servico.valorUnitario || 0)}
              </p>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700">
                Código de Tributação
              </h3>
              <p className="text-sm sm:text-base text-gray-900">{servico.codigoTributacao}</p>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700">Item Lista Serviço</h3>
              <p className="text-sm sm:text-base text-gray-900">{servico.itemListaServico}</p>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700">Alíquota</h3>
              <p className="text-sm sm:text-base text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'percent',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(
                  (servico.aliquota || 0) > 1
                    ? (servico.aliquota || 0) / 100
                    : servico.aliquota || 0
                )}
              </p>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-medium text-gray-700">ISS Retido</h3>
              <Badge variant={servico.issRetido ? 'default' : 'outline'}>
                {servico.issRetido ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg sm:text-xl">Valores Calculados</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
              <h3 className="text-sm sm:text-base font-medium text-gray-700">Base de Cálculo</h3>
              <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words">
                {formatarNumero(servico.baseCalculo || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 break-words">
                Valor do serviço - deduções - desconto incondicionado
              </p>
            </div>

            <div className="p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
              <h3 className="text-sm sm:text-base font-medium text-gray-700">
                Valor do ISS {servico.issRetido ? '(Retido)' : ''}
              </h3>
              <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words">
                {formatarNumero(servico.valorIss || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 break-words">
                {servico.issRetido
                  ? 'ISS será retido pelo tomador'
                  : `Base de cálculo x Alíquota (${(
                      servico.aliquota || 0
                    ).toFixed(2)}%)`}
              </p>
            </div>

            <div className="p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
              <h3 className="text-sm sm:text-base font-medium text-gray-700">Valor Líquido</h3>
              <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words">
                {formatarNumero(servico.valorLiquido || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 break-words">
                Valor final após todas as deduções e retenções
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
