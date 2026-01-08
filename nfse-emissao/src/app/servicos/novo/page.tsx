'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import ServicoForm from '@/components/servicos/ServicoForm';
import { usePrestador } from '@/contexts/PrestadorContext';


export default function NovoServicoPage() {
  const [loading, setLoading] = useState(true);
  const [regimeEspecialTributacao, setRegimeEspecialTributacao] = useState<number>(0);

  const { prestador } = usePrestador();
  
  useEffect(() => {
    if (prestador && typeof prestador.regimeEspecialTributacao === 'number') {
      setRegimeEspecialTributacao(prestador.regimeEspecialTributacao);
    }
    setLoading(false);
  }, [prestador]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-8 py-4 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Novo Serviço</h1>
        <Link href="/servicos" className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <ServicoForm 
          servico={{}} 
          regimeTributario={regimeEspecialTributacao} 
          isEditing={false} 
        />
      </div>
    </div>
  );
}
