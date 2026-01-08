'use client';

import { Servico } from '@/types/servico';
import { formatarNumero } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ServicoResumoProps {
  servico: Servico;
}

export default function ServicoResumo({ servico }: ServicoResumoProps) {
  // Cálculo das retenções totais
  const totalRetencoes = 
    (servico.valorPis || 0) +
    (servico.valorCofins || 0) +
    (servico.valorInss || 0) +
    (servico.valorIr || 0) +
    (servico.valorCsll || 0) +
    (servico.outrasRetencoes || 0);
  
  // Cálculo dos descontos totais
  const totalDescontos = 
    (servico.descontoCondicionado || 0) +
    (servico.descontoIncondicionado || 0);
    
  // Garantir que todos os valores numéricos existam
  const aliquota = servico.aliquota || 0;
  const valorUnitario = servico.valorUnitario || 0;
  const baseCalculo = servico.baseCalculo || 0;
  const valorIss = servico.valorIss || 0;
  const valorLiquido = servico.valorLiquido || 0;
  
  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs" title={servico.descricao}>
          {servico.descricao}
        </h3>
        <Badge variant={servico.ativo ? "outline" : "destructive"} className={servico.ativo ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
          {servico.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Código Tributação</p>
          <p className="text-xs sm:text-sm font-medium">{servico.codigoTributacao}</p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Item Lista Serviço</p>
          <p className="text-xs sm:text-sm font-medium">{servico.itemListaServico}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Valor Unitário</p>
          <p className="text-sm sm:text-base font-medium">{formatarNumero(valorUnitario)}</p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500">Alíquota</p>
          <p className="text-sm sm:text-base font-medium">
            {new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(aliquota / 100)}
          </p>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-3">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center">
                    Base de Cálculo
                    <InfoIcon size={10} className="ml-1" />
                  </p>
                  <p className="text-xs sm:text-sm font-medium">{formatarNumero(baseCalculo)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Valor do serviço - deduções - desconto incondicionado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center">
                    ISS {servico.issRetido ? '(Retido)' : ''}
                    <InfoIcon size={10} className="ml-1" />
                  </p>
                  <p className="text-xs sm:text-sm font-medium">{formatarNumero(valorIss)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {servico.issRetido 
                    ? 'ISS será retido pelo tomador' 
                    : `Base de cálculo x Alíquota (${aliquota.toFixed(2)}%)`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500 flex items-center justify-center">
                    Valor Líquido
                    <InfoIcon size={10} className="ml-1" />
                  </p>
                  <p className="text-xs sm:text-sm font-medium">{formatarNumero(valorLiquido)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Valor final após todas as deduções e retenções</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {(totalRetencoes > 0 || totalDescontos > 0) && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] sm:text-xs text-gray-500 flex flex-wrap justify-between gap-1">
            {totalRetencoes > 0 && (
              <span>Retenções: {formatarNumero(totalRetencoes)}</span>
            )}
            {totalDescontos > 0 && (
              <span>Descontos: {formatarNumero(totalDescontos)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
