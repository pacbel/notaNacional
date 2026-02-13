export interface RobotClientDto {
  id: string;
  nome: string;
  clientId: string;
  clientSecret?: string | null;
  role: string;
  prestadorId: string;
  prestadorNome: string;
  prestadorCnpj: string;
  scopes: string[];
  ativo: boolean;
  secretGerado?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
}

export interface CreateRobotClientDto {
  nome: string;
  clientId?: string;
  clientSecret?: string;
  scopes: string[];
  ativo?: boolean;
  gerarClientIdAutomatico?: boolean;
  gerarSecretAutomatico?: boolean;
}

export interface UpdateRobotClientDto {
  nome: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  ativo: boolean;
}

export interface RotateRobotClientSecretDto {
  novoSecret?: string;
  gerarSecretAutomatico?: boolean;
}
