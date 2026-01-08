'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { consultarCep, CepResponse } from '@/services/cepService';
import { toast } from 'react-hot-toast';

interface CepInputProps {
  defaultValue?: string;
  onCepFound?: (data: CepResponse) => void;
}

export default function CepInput({ defaultValue = '', onCepFound }: CepInputProps) {
  const [cep, setCep] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);

  // Função para buscar o CEP
  const buscarCep = useCallback(async (cepLimpo: string) => {
    if (isLoading) return; // Evita múltiplas requisições simultâneas
    setIsLoading(true);
    
    try {
      const data = await consultarCep(cepLimpo);
      
      if (data) {
        // Atualiza os campos do formulário
        const logradouroInput = document.getElementById('logradouro') as HTMLInputElement;
        const bairroInput = document.getElementById('bairro') as HTMLInputElement;
        const estadoSelect = document.getElementById('estado') as HTMLSelectElement;
        const municipioSelect = document.getElementById('municipio') as HTMLSelectElement;

        if (logradouroInput) logradouroInput.value = data.logradouro || '';
        if (bairroInput) bairroInput.value = data.bairro || '';

        // Atualiza estado e município
        if (data.uf && estadoSelect) {
          estadoSelect.value = data.uf;
          // Dispara evento de change para atualizar lista de municípios
          estadoSelect.dispatchEvent(new Event('change'));

          // Aguarda a lista de municípios ser atualizada
          setTimeout(() => {
            if (municipioSelect && data.localidade) {
              municipioSelect.value = data.localidade;
            }
          }, 500);
        }

        // Callback para o componente pai
        if (onCepFound) {
          onCepFound(data);
        }

        //toast.success('CEP encontrado com sucesso!');
      } else {
        toast.error('CEP não encontrado ou inválido');
      }
    } catch (error: unknown) {
      toast.error('Erro ao buscar CEP. Tente novamente.');
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onCepFound]);

  // Executa busca inicial apenas quando defaultValue mudar, evitando reexecução por mudança de callbacks
  const ranForDefaultRef = useRef<string | null>(null);
  useEffect(() => {
    if (!defaultValue) return;
    const cepLimpo = defaultValue.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    // Evita chamadas repetidas para o mesmo valor
    if (ranForDefaultRef.current === cepLimpo) return;
    ranForDefaultRef.current = cepLimpo;
    void buscarCep(cepLimpo);
  }, [defaultValue]);

  // Aplica a máscara ao CEP (formato: 00000-000)
  const formatCep = (value: string) => {
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length <= 5) {
      return cepLimpo;
    }
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
  };

  // Manipula a mudança no campo de CEP
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatCep(value);
    setCep(formattedValue);

    // Atualiza o valor do campo hidden
    const hiddenInput = document.getElementById('cep') as HTMLInputElement;
    if (hiddenInput) hiddenInput.value = formattedValue;
  };

  // Busca o CEP quando o usuário terminar de digitar
  const handleBlur = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length === 8) {
      await buscarCep(cepLimpo);
    }
  };

  // Busca o CEP quando o usuário pressionar Tab ou Enter
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const cepLimpo = cep.replace(/\D/g, '');
      
      // Verifica se o CEP tem 8 dígitos
      if (cepLimpo.length === 8) {
        await buscarCep(cepLimpo);
      }
    }
  };

  // Efeito para formatar o CEP inicial
  useEffect(() => {
    if (!defaultValue) return;
    const formatted = formatCep(defaultValue);
    setCep((prev) => (prev === formatted ? prev : formatted));
  }, [defaultValue]);

  return (
    <div className="relative">
      <input
        type="text"
        value={cep}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="00000-000"
        maxLength={9}
        required
        disabled={isLoading}
        aria-label="CEP"
      />
      <input type="hidden" name="cep" id="cep" defaultValue={defaultValue} />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
