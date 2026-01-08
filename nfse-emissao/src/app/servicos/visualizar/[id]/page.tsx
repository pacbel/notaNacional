'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import ServicoDetalhes from '@/components/servicos/ServicoDetalhes';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Power, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import AlterarStatusDialog from '@/components/servicos/AlterarStatusDialog';
import { Servico } from '@/types/servico';
import { Badge } from '@/components/ui/badge';

// Definir o tipo correto para os parâmetros
type PageParams = {
  id: string;
};

export default function VisualizarServicoPage({
  params,
}: {
  params: PageParams;
}) {
  // Usar React.use() para desempacotar o objeto params de forma segura
  const { id } = use(params as unknown as Promise<PageParams>);
  const router = useRouter();
  const [servico, setServico] = useState<Servico | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  useEffect(() => {
    const fetchServico = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/servicos/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Importante para enviar cookies de autenticação
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Sessão expirada. Redirecionando para login...');
            router.push('/login');
            return;
          }
          throw new Error('Erro ao buscar dados do serviço');
        }

        const data = await response.json();
        setServico(data);
      } catch (error) {
        console.error('Erro ao buscar serviço:', error);
        toast.error('Não foi possível carregar os dados do serviço');
      } finally {
        setLoading(false);
      }
    };

    fetchServico();
  }, [id, router]);

  const confirmarAlteracaoStatus = () => {
    setShowStatusDialog(true);
  };

  const alterarStatusServico = async () => {
    try {
      setShowStatusDialog(false);

      const response = await fetch('/api/servicos/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: servico?.id,
          ativo: !servico?.ativo,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status do serviço');
      }

      const result = await response.json();
      toast.success(
        result.message ||
          `Serviço ${servico?.ativo ? 'inativado' : 'ativado'} com sucesso`
      );

      // Atualiza o estado local
      if (servico) {
        setServico({
          ...servico,
          ativo: !servico.ativo,
        });
      }

      // Aguarda um pouco antes de atualizar a página
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Não foi possível alterar o status do serviço');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 sm:h-64">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 mb-6">
          <Link href="/servicos" className="sm:mr-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Serviço não encontrado</h1>
        </div>
        <p className="text-sm sm:text-base">O serviço solicitado não foi encontrado ou não está disponível.</p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 mb-6">
        <Link href="/servicos" className="sm:mr-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Detalhes do Serviço</h1>

        {servico.ativo ? (
          <Badge className="ml-2 sm:ml-3 bg-green-100 text-green-800 border-green-300 text-xs sm:text-sm">
            <CheckCircle className="h-3 w-3 mr-1" /> Ativo
          </Badge>
        ) : (
          <Badge className="ml-2 sm:ml-3 bg-red-100 text-red-800 border-red-300 text-xs sm:text-sm">
            <XCircle className="h-3 w-3 mr-1" /> Inativo
          </Badge>
        )}
      </div>

      <div>
        <div className="flex flex-wrap justify-start sm:justify-end gap-2 mb-3 sm:mb-4">
          <Link href={`/servicos/${servico.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          </Link>
          <Button
            variant={servico.ativo ? 'destructive' : 'default'}
            size="sm"
            onClick={confirmarAlteracaoStatus}
            className={!servico.ativo ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Power className="mr-2 h-4 w-4" />
            {servico.ativo ? 'Inativar' : 'Ativar'}
          </Button>
        </div>

        <ServicoDetalhes servico={servico} />
      </div>

      <AlterarStatusDialog
        servico={servico}
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        onConfirm={alterarStatusServico}
      />
    </div>
  );
}
