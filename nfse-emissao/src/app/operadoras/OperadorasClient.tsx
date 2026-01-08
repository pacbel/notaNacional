'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2, Filter, CreditCard } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatarCnpj } from '@/utils/formatters';
import type { OperadoraListItem } from './OperadorasWrapper';

interface OperadorasClientProps {
  operadoras: OperadoraListItem[];
  filtroAtual: string;
}

export default function OperadorasClient({ operadoras: initialData, filtroAtual = 'ativos' }: OperadorasClientProps) {
  const [items, setItems] = useState<OperadoraListItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const alterarStatus = async (id: string, ativo: boolean) => {
    const acao = ativo ? 'inativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${acao} esta operadora?`)) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/operadoras/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !ativo }),
      });
      if (!response.ok) {
        let msg = `Erro ao ${acao} operadora`;
        try { const j = await response.json(); if (j?.error) msg = j.error; } catch {}
        throw new Error(msg);
      }
      toast.success(`Operadora ${ativo ? 'inativada' : 'ativada'} com sucesso`);
      setItems(items.map(i => i.id === id ? { ...i, ativo: !ativo } : i));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Falha ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Operadoras de Cartão</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button onClick={() => { window.history.pushState({}, '', '/operadoras?filtro=ativos'); setItems(initialData.filter(i => i.ativo)); }} className={`px-3 py-1 text-sm ${filtroAtual === 'ativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Ativos</button>
              <button onClick={() => { window.history.pushState({}, '', '/operadoras?filtro=inativos'); setItems(initialData.filter(i => !i.ativo)); }} className={`px-3 py-1 text-sm ${filtroAtual === 'inativos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Inativos</button>
              <button onClick={() => { window.history.pushState({}, '', '/operadoras?filtro=todos'); setItems(initialData); }} className={`px-3 py-1 text-sm ${filtroAtual === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Todos</button>
            </div>
          </div>
          <Link href="/operadoras/novo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2">
            <PlusCircle size={18} />
            <span>Nova Operadora</span>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">Carregando...</td></tr>
              ) : items.length > 0 ? (
                items.map(o => (
                  <tr key={o.id} className={`hover:bg-gray-50 ${!o.ativo ? 'bg-gray-100' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">{o.codigo}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 flex items-center gap-2"><CreditCard size={16} className="text-indigo-500" />{o.bandeiraCodigo} - {o.bandeiraDescricao}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 truncate max-w-xs">{o.descricao}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{formatarCnpj(o.cnpj)}</td>
                    <td className="px-3 py-3 text-sm"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${o.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{o.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td className="px-3 py-3 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/operadoras/${o.id}`} className="text-blue-600 hover:text-blue-900 flex items-center gap-1"><Pencil size={14} /><span>Editar</span></Link>
                        <button onClick={() => alterarStatus(o.id, o.ativo)} className={`${o.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center gap-1`} disabled={loading}><Trash2 size={14} /><span>{o.ativo ? 'Inativar' : 'Ativar'}</span></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">Nenhuma operadora encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
