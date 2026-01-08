"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FiltrosRelatorio from '@/components/relatorios/FiltrosRelatorio';
import BotoesRelatorio from '@/components/relatorios/BotoesRelatorio';

interface Prestador {
  id: string;
  razaoSocial: string;
  cnpj: string;
}

interface LogsContainerProps {
  prestadores: Prestador[];
}

export default function LogsContainer({ prestadores }: LogsContainerProps) {
  // Se o usuário não for master ou admin, já define o prestador
  const { user, isMaster, isAdmin } = useAuth();
  
  const prestadorInicial = !isMaster && !isAdmin && user?.prestadorId ? user.prestadorId : '';
  
  // Inicializar filtros com o prestador inicial se disponível
  const [filtros, setFiltros] = useState<Record<string, string | number>>({
    prestadorId: prestadorInicial
  });
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string; username: string }[]>([]);

  // Buscar usuários quando o prestador mudar
  useEffect(() => {
    const buscarUsuarios = async () => {
      const prestadorId = filtros.prestadorId || prestadorInicial;
      
      if (!prestadorId) return;
      
      try {
        const response = await fetch(`/api/usuarios?prestadorId=${prestadorId}`);
        
        if (response.ok) {
          const data = await response.json();
          setUsuarios(data.usuarios || []);
        }
      } catch (error: unknown) {
        console.error('Erro ao buscar usuários:', error);
      }
    };
    
    buscarUsuarios();
  }, [filtros.prestadorId, prestadorInicial]);

  // Campos de filtro para o relatório
  const camposFiltro = [
    {
      nome: 'prestadorId',
      label: 'Prestador',
      tipo: 'select' as const,
      opcoes: prestadores.map(p => ({ valor: p.id, label: p.razaoSocial })),
      placeholder: 'Selecione um prestador',
    },
    {
      nome: 'usuarioId',
      label: 'Usuário',
      tipo: 'select' as const,
      opcoes: usuarios.map(u => ({ valor: u.id, label: `${u.nome} (${u.username})` })),
      placeholder: 'Selecione um usuário',
    },
    {
      nome: 'entidade',
      label: 'Entidade',
      tipo: 'select' as const,
      opcoes: [
        { valor: 'Prestador', label: 'Prestador' },
        { valor: 'Tomador', label: 'Tomador' },
        { valor: 'Serviço', label: 'Serviço' },
        { valor: 'NotaFiscal', label: 'Nota Fiscal' },
        { valor: 'Usuário', label: 'Usuário' },
      ],
      placeholder: 'Selecione uma entidade',
    },
    {
      nome: 'acao',
      label: 'Ação',
      tipo: 'select' as const,
      opcoes: [
        { valor: 'Criar', label: 'Criar' },
        { valor: 'Editar', label: 'Editar' },
        { valor: 'Excluir', label: 'Excluir' },
        { valor: 'Transmitir', label: 'Transmitir' },
        { valor: 'Cancelar', label: 'Cancelar' },
        { valor: 'Login', label: 'Login' },
        { valor: 'Logout', label: 'Logout' },
      ],
      placeholder: 'Selecione uma ação',
    },
    {
      nome: 'tela',
      label: 'Tela',
      tipo: 'select' as const,
      opcoes: [
        { valor: 'Prestadores', label: 'Prestadores' },
        { valor: 'Tomadores', label: 'Tomadores' },
        { valor: 'Serviços', label: 'Serviços' },
        { valor: 'Emissão de NFS-e', label: 'Emissão de NFS-e' },
        { valor: 'Usuários', label: 'Usuários' },
        { valor: 'Login', label: 'Login' },
      ],
      placeholder: 'Selecione uma tela',
    },
    {
      nome: 'dataInicio',
      label: 'Data Início',
      tipo: 'data' as const,
    },
    {
      nome: 'dataFim',
      label: 'Data Fim',
      tipo: 'data' as const,
    },
  ];

  // Filtrar campos de acordo com o perfil do usuário
  const camposFiltrados = camposFiltro.filter(campo => {
    // Se o campo for 'prestadorId', só mostrar para master e admin
    if (campo.nome === 'prestadorId') {
      return isMaster || isAdmin;
    }
    return true;
  });
  
  // Se o usuário não for master ou admin, remover o prestadorId dos filtros
  // pois ele será definido automaticamente
  if (!isMaster && !isAdmin) {
    delete filtros.prestadorId;
  }

  const handleFiltrar = (novosFiltros: Record<string, string | number>) => {
    // Se o usuário não for master ou admin, adiciona o prestadorId
    if (!isMaster && !isAdmin && user?.prestadorId) {
      novosFiltros.prestadorId = user.prestadorId;
    }
    
    setFiltros(novosFiltros);
  };

  const handleImprimir = async () => {
    try {
      // Verificar se há um prestador selecionado
      const prestadorId = filtros.prestadorId || prestadorInicial;
      
      // Se for usuário Master e não selecionou prestador, exibir alerta
      if (isMaster && !prestadorId) {
        alert('Selecione um prestador para gerar o relatório.');
        return;
      }
      
      // Para usuários não Master, usar o prestador vinculado
      const prestadorIdFinal = isMaster ? prestadorId : user?.prestadorId;

      // Preparar os filtros para enviar para a API
      const filtrosParaEnviar = { ...filtros };
      
      // Usar a nova rota de relatório HTML em vez da rota de PDF
      // Abrir uma nova janela para o relatório
      const janela = window.open('', '_blank');
      
      if (!janela) {
        alert('Por favor, permita pop-ups para visualizar o relatório.');
        return;
      }
      
      // Exibir mensagem de carregamento na nova janela
      janela.document.write('<html><body><h2>Carregando relatório...</h2></body></html>');
      
      // Fazer a requisição para a API
      const response = await fetch('/api/relatorios/logs-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prestadorId: prestadorIdFinal,
          filtros: filtrosParaEnviar,
        }),
      });

      if (!response.ok) {
        const erro = await response.json();
        janela.close(); // Fechar a janela em caso de erro
        throw new Error(erro.error || 'Erro ao gerar relatório');
      }

      // Obter o HTML do relatório
      const html = await response.text();
      
      // Escrever o HTML na nova janela
      janela.document.open();
      janela.document.write(html);
      janela.document.close();
    } catch (error: unknown) {
      console.error('Erro ao gerar relatório:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao gerar relatório: ${msg}`);
    }
  };

  return (
    <div>
      <FiltrosRelatorio 
        campos={camposFiltrados} 
        onFiltrar={handleFiltrar} 
      />
      
      <BotoesRelatorio 
        onImprimir={handleImprimir} 
        urlVoltar="/relatorios" 
      />
    </div>
  );
}
