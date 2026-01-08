"use client";

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Log {
  id: string;
  prestadorId: string;
  usuarioId: string;
  usuario: {
    nome: string;
    username: string;
  };
  acao: string;
  entidade: string;
  entidadeId: string;
  descricao: string;
  dataHora: string;
  tela: string;
}

interface LogsTableProps {
  logs: Log[];
  loading: boolean;
  paginacao?: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
  onPageChange?: (pagina: number) => void;
  onLimiteChange?: (limite: number) => void;
}

export default function LogsTable({ logs, loading, paginacao, onPageChange, onLimiteChange }: LogsTableProps) {
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tela</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatarData(log.dataHora)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.usuario.nome} ({log.usuario.username})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAcaoColor(log.acao)}`}>
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entidade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.tela}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.descricao}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum log encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Controles de paginau00e7u00e3o */}
      {paginacao && paginacao.totalPaginas > 0 && (
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 border-t border-gray-200">
          <div className="flex items-center mb-4 sm:mb-0">
            <span className="text-sm text-gray-700">
              Mostrando {(paginacao.pagina - 1) * paginacao.limite + 1} a {Math.min(paginacao.pagina * paginacao.limite, paginacao.total)} de {paginacao.total} registros
            </span>
            
            <div className="ml-4">
              <label htmlFor="limite" className="mr-2 text-sm text-gray-700">Registros por página:</label>
              <select
                id="limite"
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={paginacao.limite}
                onChange={(e) => onLimiteChange && onLimiteChange(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => onPageChange && onPageChange(paginacao.pagina - 1)}
              disabled={paginacao.pagina === 1}
              className="px-3 py-1 border border-gray-300 rounded-l bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, paginacao.totalPaginas) }, (_, i) => {
              // Lu00f3gica para mostrar as pu00e1ginas ao redor da pu00e1gina atual
              let pageNum;
              if (paginacao.totalPaginas <= 5) {
                pageNum = i + 1;
              } else if (paginacao.pagina <= 3) {
                pageNum = i + 1;
              } else if (paginacao.pagina >= paginacao.totalPaginas - 2) {
                pageNum = paginacao.totalPaginas - 4 + i;
              } else {
                pageNum = paginacao.pagina - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className={`px-3 py-1 border-t border-b border-r border-gray-300 ${
                    paginacao.pagina === pageNum ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange && onPageChange(paginacao.pagina + 1)}
              disabled={paginacao.pagina === paginacao.totalPaginas}
              className="px-3 py-1 border-t border-b border-r border-gray-300 rounded-r bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Função para definir a cor do badge de acordo com a ação
function getAcaoColor(acao: string): string {
  switch (acao) {
    case 'Criar':
      return 'bg-green-100 text-green-800';
    case 'Editar':
      return 'bg-blue-100 text-blue-800';
    case 'Excluir':
      return 'bg-red-100 text-red-800';
    case 'Transmitir':
      return 'bg-purple-100 text-purple-800';
    case 'Cancelar':
      return 'bg-orange-100 text-orange-800';
    case 'Login':
      return 'bg-teal-100 text-teal-800';
    case 'Logout':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
