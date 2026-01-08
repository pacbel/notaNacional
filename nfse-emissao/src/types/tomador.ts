export interface Tomador {
  id: string;
  cpfCnpj: string;
  tipo: 'J' | 'F';
  razaoSocial: string;
  inscricaoMunicipal?: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
  createdAt: string;
  updatedAt: string;
}
