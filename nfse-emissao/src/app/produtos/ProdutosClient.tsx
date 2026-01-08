'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2, Filter } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import type { ProdutoListItem } from './ProdutosWrapper';

interface ProdutosClientProps {
  produtos: ProdutoListItem[];
  filtroAtual: string;
}

export default function ProdutosClient({ produtos: initialProdutos, filtroAtual = 'ativos' }: ProdutosClientProps) {
  const [produtos, setProdutos] = useState<ProdutoListItem[]>(initialProdutos);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const alterarStatus = async (id: string, ativo: boolean) => {
    const acao = ativo ? 'inativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${acao} este produto?`)) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/produtos/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !ativo }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ao ${acao} produto`);
        } catch {
          throw new Error(`Erro ao ${acao} produto`);
        }
      }

      toast.success(`Produto ${ativo ? 'inativado' : 'ativado'} com sucesso`);
      setProdutos(produtos.map(p => (p.id === id ? { ...p, ativo: !ativo } : p)));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha na alteração de status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/produtos?filtro=ativos');
                  setProdutos(initialProdutos.filter(p => p.ativo));
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'ativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Ativos
              </button>
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/produtos?filtro=inativos');
                  setProdutos(initialProdutos.filter(p => !p.ativo));
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'inativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Inativos
              </button>
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/produtos?filtro=todos');
                  setProdutos(initialProdutos);
                }}
                className={`px-3 py-1 text-sm ${filtroAtual === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Todos
              </button>
            </div>
          </div>

          <Link href="/produtos/novo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2">
            <PlusCircle size={18} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NCM</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CFOP</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UN</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">Carregando...</td>
                </tr>
              ) : produtos.length > 0 ? (
                produtos.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.ativo ? 'bg-gray-100' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">{p.codigo}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-xs">{p.descricao}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{p.ncm || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{p.cfop || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{p.unidade || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{p.precoVenda?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/produtos/${p.id}`} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                          <Pencil size={14} />
                          <span>Editar</span>
                        </Link>
                        <button
                          onClick={() => alterarStatus(p.id, p.ativo)}
                          className={`${p.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center gap-1`}
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                          <span>{p.ativo ? 'Inativar' : 'Ativar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">Nenhum produto encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
