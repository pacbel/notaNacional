'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import ServicoForm from '@/components/servicos/ServicoForm';
import { usePrestador } from '@/contexts/PrestadorContext';

interface Servico {
  id: string;
  descricao: string;
  codigoTributacao: string;
  itemListaServico: string;
  valorUnitario: number;
  aliquota: number;
  issRetido: boolean;
  exigibilidadeIss: number;
  valorDeducoes: number;
  descontoCondicionado: number;
  descontoIncondicionado: number;
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  outrasRetencoes: number;
}

export default function EditarServicoPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const { prestador } = usePrestador();
  
  const [servico, setServico] = useState<Servico | null>(null);
  const [loading, setLoading] = useState(true);
  const [regimeEspecialTributacao, setRegimeEspecialTributacao] = useState<number>(0);
  
  // Carregar dados do serviço e do prestador
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      
      try {
        // Carregar dados do prestador
        if (prestador && typeof prestador.regimeEspecialTributacao === 'number') {
          setRegimeEspecialTributacao(prestador.regimeEspecialTributacao);
        }
        
        // Se não for uma nova página, carregar os dados do serviço
        if (id && id !== 'novo') {
          const response = await fetch(`/api/servicos/get?id=${id}`);
          
          if (!response.ok) {
            throw new Error('Erro ao buscar serviço');
          }
          
          const data = await response.json();
          setServico(data);
        } else {
          // Se for um novo serviço, inicializa com valores padrão
          setServico({
            id: '',
            descricao: '',
            codigoTributacao: '',
            itemListaServico: '',
            valorUnitario: 0,
            aliquota: 0,
            issRetido: false,
            exigibilidadeIss: 1,
            valorDeducoes: 0,
            descontoCondicionado: 0,
            descontoIncondicionado: 0,
            valorPis: 0,
            valorCofins: 0,
            valorInss: 0,
            valorIr: 0,
            valorCsll: 0,
            outrasRetencoes: 0
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar os dados do serviço');
        router.push('/servicos');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [id, prestador, router]);
  
  if (loading || !servico) {
    return (
      <div className="container mx-auto px-3 sm:px-8 py-3 sm:py-8">
        <div className="flex justify-center items-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-3 sm:px-8 py-3 sm:py-8">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{id === 'novo' ? 'Novo Serviço' : 'Editar Serviço'}</h1>
        <Link href="/servicos" className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-3 sm:p-6">
        <ServicoForm 
          servico={servico} 
          isEditing={id !== 'novo'} 
        />
      </div>
    </div>
  );
}