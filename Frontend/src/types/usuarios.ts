export interface UsuarioDto {
  id: string;
  nome: string;
  email: string;
  role: string;
  prestadorId?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
  ativo: boolean;
}

export interface CreateUsuarioDto {
  nome: string;
  email: string;
  role: string;
  senha: string;
  prestadorId: string;
}

export interface UpdateUsuarioDto {
  nome: string;
  email: string;
  role: string;
  prestadorId: string;
  senha?: string;
}

export interface ChangePasswordDto {
  senhaAtual: string;
  novaSenha: string;
}
