"use client";

import { Usuario } from '@/types/usuario';
import { Pencil, Trash2 } from 'lucide-react';

interface UsuariosListProps {
  usuarios: Usuario[];
  onSelectUsuario: (usuario: Usuario) => void;
  onDeleteUsuario: (id: string) => void;
}

export default function UsuariosList({ usuarios, onSelectUsuario, onDeleteUsuario }: UsuariosListProps) {
  const formatarData = (data: Date | string | null | undefined) => {
    if (!data) return 'Nunca acessou';
    
    const date = typeof data === 'string' ? new Date(data) : data;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {usuarios.length > 0 ? (
            usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatarData(usuario.last_access)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onSelectUsuario(usuario)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Pencil size={16} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onDeleteUsuario(usuario.id)}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum usuário cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
