"use client";

import { useState, useEffect } from 'react';
import { Usuario, UsuarioFormData } from '@/types/usuario';
import { useAuth } from '@/contexts/AuthContext';

interface UsuarioFormProps {
  prestadorId: string;
  usuario: Usuario | null;
  onUsuarioSaved: (usuario: Usuario) => void;
  onCancel: () => void;
}

export default function UsuarioForm({ prestadorId, usuario, onUsuarioSaved, onCancel }: UsuarioFormProps) {
  const { user, isMaster } = useAuth();
  
  const [formData, setFormData] = useState<UsuarioFormData>({
    nome: '',
    email: '',
    username: '',
    password: '',
    role: 'Usuário',
    ativo: true,
    prestadorId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setFormData({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        username: usuario.username,
        password: '', // Não preencher a senha ao editar
        role: usuario.role,
        ativo: usuario.ativo,
        prestadorId
      });
    } else {
      // Resetar o formulário para um novo usuário
      setFormData({
        nome: '',
        email: '',
        username: '',
        password: '',
        role: 'Usuário',
        ativo: true,
        prestadorId
      });
    }
  }, [usuario, prestadorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validações
      if (!formData.nome || !formData.email || !formData.username) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      if (!formData.id && !formData.password) {
        throw new Error('A senha é obrigatória para novos usuários');
      }

      const isNewUser = !formData.id;
      const method = isNewUser ? 'POST' : 'PUT';
      const url = isNewUser ? '/api/usuarios' : `/api/usuarios/${formData.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar usuário');
      }

      const savedUsuario = await response.json();
      onUsuarioSaved(savedUsuario);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o usuário');
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo*</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail*</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário*</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {usuario ? 'Senha (deixe em branco para manter a atual)' : 'Senha*'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required={!usuario}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Perfil*</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {/* Removida a opção Master conforme solicitado */}
            <option value="Administrador">Administrador</option>
            <option value="Usuário">Usuário</option>
          </select>
        </div>

        <div className="flex items-center h-full pt-6">
          <input
            type="checkbox"
            id="ativo"
            name="ativo"
            checked={formData.ativo}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">Usuário Ativo</label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : usuario ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}
