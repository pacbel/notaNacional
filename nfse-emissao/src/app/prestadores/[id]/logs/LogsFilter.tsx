"use client";

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  username: string;
}

interface LogsFilterProps {
  usuarios: Usuario[];
  onFilterChange: (filtros: any) => void;
}

export default function LogsFilter({ usuarios, onFilterChange }: LogsFilterProps) {
  const [filtros, setFiltros] = useState({
    usuarioId: '',
    dataInicio: '',
    dataFim: '',
    entidade: '',
    acao: '',
    tela: '',
  });

  // Lista de entidades disponíveis para filtro
  const entidades = [
    'Prestador',
    'Tomador',
    'Serviço',
    'NotaFiscal',
    'Usuário',
  ];

  // Lista de ações disponíveis para filtro
  const acoes = [
    'Criar',
    'Editar',
    'Excluir',
    'Transmitir',
    'Cancelar',
    'Login',
    'Logout',
  ];

  // Lista de telas disponíveis para filtro
  const telas = [
    'Prestadores',
    'Tomadores',
    'Serviços',
    'Emissão de NFS-e',
    'Usuários',
    'Login',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filtros);
  };

  const handleLimpar = () => {
    setFiltros({
      usuarioId: '',
      dataInicio: '',
      dataFim: '',
      entidade: '',
      acao: '',
      tela: '',
    });
    onFilterChange({});
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filtros</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="usuarioId" className="block text-sm font-medium text-gray-700 mb-1">
            Usuário
          </label>
          <select
            id="usuarioId"
            name="usuarioId"
            value={filtros.usuarioId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os usuários</option>
            {usuarios.map(usuario => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome} ({usuario.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-1">
            Data Início
          </label>
          <input
            type="date"
            id="dataInicio"
            name="dataInicio"
            value={filtros.dataInicio}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            id="dataFim"
            name="dataFim"
            value={filtros.dataFim}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="entidade" className="block text-sm font-medium text-gray-700 mb-1">
            Entidade
          </label>
          <select
            id="entidade"
            name="entidade"
            value={filtros.entidade}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas as entidades</option>
            {entidades.map(entidade => (
              <option key={entidade} value={entidade}>
                {entidade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="acao" className="block text-sm font-medium text-gray-700 mb-1">
            Ação
          </label>
          <select
            id="acao"
            name="acao"
            value={filtros.acao}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas as ações</option>
            {acoes.map(acao => (
              <option key={acao} value={acao}>
                {acao}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tela" className="block text-sm font-medium text-gray-700 mb-1">
            Tela
          </label>
          <select
            id="tela"
            name="tela"
            value={filtros.tela}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas as telas</option>
            {telas.map(tela => (
              <option key={tela} value={tela}>
                {tela}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={handleLimpar}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Limpar Filtros
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          >
            <Search className="mr-2 h-4 w-4" />
            Filtrar
          </button>
        </div>
      </form>
    </div>
  );
}
