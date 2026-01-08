'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ValorMonetarioInput from '@/components/ui/ValorMonetarioInput';
import { Servico } from '@/types/servico';

interface ServicoFormProps {
  servico?: Partial<Servico>;
  isEditing?: boolean;
  regimeTributario?: number;
}

export default function ServicoForm({
  servico,
  isEditing = false,
  regimeTributario = 0,
}: ServicoFormProps) {
  const router = useRouter();

  // Garantir que servico seja um objeto válido para evitar erros de acesso a propriedades
  const servicoData = servico || {};

  // Estados para os campos do formulário
  const [descricao, setDescricao] = useState(servicoData.descricao || '');
  const [valorUnitario, setValorUnitario] = useState(
    servicoData.valorUnitario || 0
  );

  // Validação básica do formulário
  const isValid =
    descricao.trim() !== '' &&
    valorUnitario > 0;

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      alert('Por favor, corrija os erros antes de salvar.');
      return;
    }

    // Construir o objeto de serviço para enviar
    const servicoPayload = {
      id: servicoData.id,
      descricao,
      valorUnitario,
      valorDeducoes: 0,
      descontoIncondicionado: 0,
      descontoCondicionado: 0,
      valorPis: 0,
      valorCofins: 0,
      valorInss: 0,
      valorIr: 0,
      valorCsll: 0,
      outrasRetencoes: 0,
      issRetido: false,
      baseCalculo: valorUnitario,
      valorIss: 0,
      valorLiquido: valorUnitario,
    };

    try {
      const endpoint = isEditing
        ? `/api/servicos/update`
        : `/api/servicos/create`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(servicoPayload),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar serviço');
      }

      router.push('/servicos');
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Ocorreu um erro ao salvar o serviço. Por favor, tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos obrigatórios */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Informações Básicas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              data-testid="descricao-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Unitário <span className="text-red-500">*</span>
            </label>
            <ValorMonetarioInput
              name="valorUnitario"
              value={valorUnitario}
              onChange={setValorUnitario}
              required
              data-testid="valorUnitario-input"
            />
          </div>
        </div>
      </div>

      {/* Valores calculados */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Valores Calculados
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base de Cálculo do ISS
            </label>
            <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
              {valorUnitario.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <input type="hidden" name="baseCalculo" value={valorUnitario} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do ISS
            </label>
            <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
              {(0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <input
              type="hidden"
              name="valorIss"
              value={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Líquido
            </label>
            <div className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
              {(
                valorUnitario
              ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <input
              type="hidden"
              name="valorLiquido"
              value={valorUnitario}
            />
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3">
        <button
          type="button"
          onClick={() => router.push('/servicos')}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={`w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isValid
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
          {isEditing ? 'Atualizar' : 'Salvar'} Serviço
        </button>
      </div>
    </form>
  );
}
