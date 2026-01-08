'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import UfMunicipioSelector from '@/components/ui/UfMunicipioSelector';
import CepInput from '@/components/ui/CepInput';
import CnpjInput from '@/components/ui/CnpjInput';
import TelefoneInput from '@/components/ui/TelefoneInput';
import { CepResponse } from '@/services/cepService';
import { toast, Toaster } from 'react-hot-toast';
import { Tomador } from '@/types/interfaces';

interface TomadorFormProps {
  isNew: boolean;
  tomador: Tomador | null;
  defaultValues: {
    razaoSocial: string;
    cnpj: string;
    inscricaoMunicipal: string;
    inscricaoEstadual?: string;
    email: string;
    telefone: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    uf: string;
    codigoMunicipio: string;
  };
}

export default function TomadorForm({ isNew, tomador, defaultValues }: TomadorFormProps) {
  const [uf, setUf] = useState<string>(defaultValues.uf);
  const [codigoMunicipio, setCodigoMunicipio] = useState<string>(defaultValues.codigoMunicipio);
  const [endereco, setEndereco] = useState<string>(defaultValues.endereco);
  const [bairro, setBairro] = useState<string>(defaultValues.bairro);

  // Função para lidar com os dados do CEP encontrado
  const handleCepFound = async (data: CepResponse) => {
    
    // Preencher os campos de endereço
    setEndereco(data.logradouro);
    setBairro(data.bairro);
    
    // Primeiro resetar o código do município
    setCodigoMunicipio('');
    
    // Depois atualizar a UF
    setUf(data.uf);
    
    // Aguardar um momento para garantir que a UF seja atualizada e os municípios carregados
    setTimeout(() => {
      // Buscar e atualizar o código do município usando o código IBGE
      if (data.ibge) {
        // O código IBGE do município vem completo (ex: 3106200)
        const codigoMunicipio = data.ibge;
        setCodigoMunicipio(codigoMunicipio);
      }
    }, 500);

    // Exibir mensagem de sucesso
    //toast.success('CEP encontrado! Endereço preenchido automaticamente.');
  };

  return (
    <>
      <Toaster position="top-right" />
      <form action={`/api/tomadores/${isNew ? 'create' : 'update'}`} method="POST" className="space-y-6 w-full max-w-full">
        {!isNew && <input type="hidden" name="id" value={tomador?.id} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
            <input 
              type="text" 
              name="razaoSocial"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.razaoSocial}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
            <CnpjInput
              defaultValue={defaultValues.cnpj}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Municipal</label>
            <input 
              type="text" 
              name="inscricaoMunicipal"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.inscricaoMunicipal}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
            <input 
              type="text" 
              name="inscricaoEstadual"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.inscricaoEstadual || ''}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <TelefoneInput 
              defaultValue={defaultValues.telefone}
              required={false}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              name="email"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.email}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              name="tipo"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={tomador?.tipo || 'J'}
              required 
            >
              <option value="J">Jurídica</option>
              <option value="F">Física</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
            <CepInput 
              defaultValue={defaultValues.cep} 
              onCepFound={handleCepFound} 
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input 
              type="text" 
              name="endereco"
              id="endereco"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input 
              type="text" 
              name="numero"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.numero}
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input 
              type="text" 
              name="complemento"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              defaultValue={defaultValues.complemento}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input 
              type="text" 
              name="bairro"
              id="bairro"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              required 
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <UfMunicipioSelector
              defaultUf={uf}
              defaultCodigoMunicipio={codigoMunicipio}
              onUfChange={(newUf) => {
                setUf(newUf);
                setCodigoMunicipio('');
              }}
              onMunicipioChange={(newCodigoMunicipio) => {
                setCodigoMunicipio(newCodigoMunicipio);
              }}
            />
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-end">
          <div className="flex gap-4">
            <Link 
              href="/tomadores" 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </Link>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
              id="salvarTomador"
            >
              <Save size={18} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
