"use client";

import { useState, useEffect } from 'react';
import { Usuario, Prestador } from '@/types/usuario';
import UsuariosList from './UsuariosList';
import UsuarioForm from './UsuarioForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface UsuariosContainerProps {
  prestador: Prestador;
  usuarios: Usuario[];
}

export default function UsuariosContainer({ prestador, usuarios: initialUsuarios }: UsuariosContainerProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const router = useRouter();
  const { user, isMaster, isAdmin } = useAuth();
  
  useEffect(() => {
    // Verifica se o usuário tem acesso a este prestador
    if (user && !isMaster && user.prestadorId !== prestador.id) {
      // Redireciona para o dashboard se não tiver acesso
      router.push('/dashboard');
    }
  }, [user, isMaster, prestador.id, router]);
  
  // Filtra usuários Master da lista
  useEffect(() => {
    const filteredUsuarios = initialUsuarios.filter(usuario => usuario.role !== 'Master');
    setUsuarios(filteredUsuarios);
  }, [initialUsuarios]);

  const handleSelectUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
  };

  const handleCancelEdit = () => {
    setSelectedUsuario(null);
  };

  const handleUsuarioSaved = (savedUsuario: Usuario) => {
    if (selectedUsuario) {
      // Atualização
      setUsuarios(usuarios.map(u => u.id === savedUsuario.id ? savedUsuario : u));
    } else {
      // Novo usuário
      setUsuarios([...usuarios, savedUsuario]);
    }
    setSelectedUsuario(null);
    router.refresh();
  };

  const handleDeleteUsuario = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsuarios(usuarios.filter(u => u.id !== id));
        if (selectedUsuario?.id === id) {
          setSelectedUsuario(null);
        }
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Erro ao excluir usuário: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuários do Prestador</h1>
          <p className="text-gray-600">{prestador.razaoSocial}</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/prestadores"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden w-full">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">Lista de Usuários</h2>
          </div>
          <UsuariosList 
            usuarios={usuarios} 
            onSelectUsuario={handleSelectUsuario} 
            onDeleteUsuario={handleDeleteUsuario}
          />
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden w-full">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">
              {selectedUsuario ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
          </div>
          <UsuarioForm 
            prestadorId={prestador.id}
            usuario={selectedUsuario}
            onUsuarioSaved={handleUsuarioSaved}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    </div>
  );
}
