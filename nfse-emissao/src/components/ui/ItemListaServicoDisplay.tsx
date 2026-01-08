'use client';

import { getDescricaoItem } from '@/lib/tributacao/itensListaUtils';
import { Tooltip } from 'react-tooltip';
import { useId } from 'react';
import { formatarItemListaServico } from '@/utils/formatters';

interface ItemListaServicoDisplayProps {
  itemListaServico: string | null | undefined;
  showCode?: boolean;
}

/**
 * Componente para exibir a descrição do item da lista de serviço a partir do código
 */
export default function ItemListaServicoDisplay({ 
  itemListaServico, 
  showCode = true 
}: ItemListaServicoDisplayProps) {
  const tooltipId = useId();
  const descricao = getDescricaoItem(itemListaServico);
  
  if (descricao === 'Item não encontrado') {
    return <span className="text-gray-500">Item não encontrado</span>;
  }
  
  return (
    <>
      <span 
        data-tooltip-id={tooltipId}
        className="cursor-help"
      >
        {descricao} {showCode && itemListaServico ? `(${formatarItemListaServico(itemListaServico)})` : ''}
      </span>
      <Tooltip 
        id={tooltipId}
        place="top"
        content={descricao}
      />
    </>
  );
}