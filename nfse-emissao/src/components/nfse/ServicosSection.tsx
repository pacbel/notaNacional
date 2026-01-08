'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Servico, ServicoItem } from './NFSeForm';

interface ServicosSectionProps {
  servicos: Servico[];
  itens: ServicoItem[];
  setItens: (itens: ServicoItem[]) => void;
}

export function ServicosSection({ servicos, itens, setItens }: ServicosSectionProps) {
  const adicionarServico = () => {
    setItens([...itens, { servicoId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  };

  const removerServico = (index: number) => {
    if (itens.length > 1) {
      const novosItens = [...itens];
      novosItens.splice(index, 1);
      setItens(novosItens);
    }
  };

  const handleItemChange = (index: number, field: keyof ServicoItem, value: string | number) => {
    const novosItens = [...itens];
    const item = { ...novosItens[index] };

    if (field === 'servicoId') {
      item.servicoId = String(value);
    } else if (field === 'quantidade') {
      item.quantidade = Number(value) || 0;
    } else if (field === 'valorUnitario') {
      item.valorUnitario = Number(value) || 0;
    } else if (field === 'valorTotal') {
      item.valorTotal = Number(value) || 0;
    }

    if (field === 'servicoId') {
      const servicoSelecionado = servicos.find(s => s.id === value);
      item.valorUnitario = servicoSelecionado ? servicoSelecionado.valorUnitario : 0;
    }

    const quantidade = Number(item.quantidade) || 0;
    const valorUnitario = Number(item.valorUnitario) || 0;
    item.valorTotal = quantidade * valorUnitario;

    novosItens[index] = item;
    setItens(novosItens);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Serviços</h2>
        <button 
          type="button" 
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition flex items-center gap-1"
          onClick={adicionarServico}
          id="adicionar-servico"
          data-testid="adicionar-servico-button"
        >
          <Plus size={16} />
          <span>Adicionar</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unitário</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody id="servicos-container" className="bg-white divide-y divide-gray-200">
            {itens.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select 
                    name="servicoId[]"
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={item.servicoId}
                    onChange={(e) => handleItemChange(index, 'servicoId', e.target.value)}
                    required
                    data-testid={`servico-select${index > 0 ? `-${index}` : ''}`}
                  >
                    <option value="">Selecione um serviço</option>
                    {servicos.map((servico) => (
                      <option key={servico.id} value={servico.id}>
                        {servico.descricao}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="number" 
                    name="quantidades[]"
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    min="1"
                    step="1"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value, 10) || 0)}
                    required
                    data-testid={`quantidade-input${index > 0 ? `-${index}` : ''}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="text" 
                    name="valoresUnitarios[]"
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={Number(item.valorUnitario).toFixed(2)}
                    onChange={(e) => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value.replace(',', '.')) || 0)}
                    required
                    data-testid={`valor-unitario-input${index > 0 ? `-${index}` : ''}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="text" 
                    name={`itens.${index}.valorTotal`}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={Number(item.valorTotal).toFixed(2)}
                    readOnly
                    data-testid={`valor-total-input${index > 0 ? `-${index}` : ''}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    type="button" 
                    className="text-red-600 hover:text-red-900"
                    onClick={() => removerServico(index)}
                    aria-label="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
