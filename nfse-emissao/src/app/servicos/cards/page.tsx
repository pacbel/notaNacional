'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Servico } from '@/types/servico';
import ServicoResumo from '@/components/servicos/ServicoResumo';
import { Button } from '@/components/ui/button';
import { Filter, List, PlusCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServicosCardsPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('ativos');

  useEffect(() => {
    const fetchServicos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/servicos/list?filtro=${filtro}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar serviços');
        }
        
        const data = await response.json();
        setServicos(data);
      } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        toast.error('Não foi possível carregar a lista de serviços');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServicos();
  }, [filtro]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Serviços</h1>
          <p className="text-sm sm:text-base text-gray-600">Visualize e gerencie os serviços cadastrados</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/servicos')}>
            <List size={16} className="mr-1" />
            Visualizar em Lista
          </Button>
          
          <Button asChild>
            <Link href="/servicos/novo" className="flex items-center">
              <PlusCircle size={16} className="mr-1" />
              Novo Serviço
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="ativos" className="mb-4 sm:mb-6" onValueChange={(value: string) => setFiltro(value as 'todos' | 'ativos' | 'inativos')}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          <TabsList>
            <TabsTrigger value="ativos">Ativos</TabsTrigger>
            <TabsTrigger value="inativos">Inativos</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={16} />
            <span>Filtro: {filtro.charAt(0).toUpperCase() + filtro.slice(1)}</span>
          </div>
        </div>
        
        <TabsContent value="ativos" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : servicos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {servicos.map((servico) => (
                <Link href={`/servicos/visualizar/${servico.id}`} key={servico.id} className="block hover:opacity-90 transition-opacity">
                  <ServicoResumo servico={servico} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-500">Nenhum serviço encontrado nesta categoria</p>
              <Button asChild className="mt-4">
                <Link href="/servicos/novo">Cadastrar Novo Serviço</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="inativos" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : servicos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {servicos.map((servico) => (
                <Link href={`/servicos/visualizar/${servico.id}`} key={servico.id} className="block hover:opacity-90 transition-opacity">
                  <ServicoResumo servico={servico} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-500">Nenhum serviço inativo encontrado</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="todos" className="mt-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : servicos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {servicos.map((servico) => (
                <Link href={`/servicos/visualizar/${servico.id}`} key={servico.id} className="block hover:opacity-90 transition-opacity">
                  <ServicoResumo servico={servico} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-500">Nenhum serviço cadastrado</p>
              <Button asChild className="mt-4">
                <Link href="/servicos/novo">Cadastrar Novo Serviço</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
