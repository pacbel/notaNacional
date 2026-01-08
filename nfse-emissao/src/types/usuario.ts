export interface Usuario {
  id: string;
  nome: string;
  email: string;
  username: string;
  password?: string; // opcional para nu00e3o retornar nas consultas
  role: 'Master' | 'Administrador' | 'Usuário';
  ativo: boolean;
  last_access?: Date | string | null;
  prestadorId: string;
  prestador?: Prestador; // relacionamento com prestador
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Prestador {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  inscricaoMunicipal: string;
  email: string;
  telefone: string | null;
  endereco: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  logoPath?: string | null;
  usuarios?: Usuario[];
}

export interface UsuarioFormData {
  id?: string;
  nome: string;
  email: string;
  username: string;
  password?: string;
  role: 'Master' | 'Administrador' | 'Usuário';
  ativo: boolean;
  prestadorId: string;
}
