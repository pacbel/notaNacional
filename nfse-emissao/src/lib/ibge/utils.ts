import estados from './estados.json';
import municipios from './municipios.json';

// Tipos
type Estado = {
  sigla: string;
  nome: string;
};

type Estados = {
  [codigo: string]: Estado;
};

type Municipios = {
  [codigo: string]: string;
};

// Funções para manipulação de estados
export const getEstados = (): Estados => {
  return estados as Estados;
};

export const getEstadosArray = (): { codigo: string; sigla: string; nome: string }[] => {
  const estadosObj = getEstados();
  return Object.entries(estadosObj).map(([codigo, estado]) => ({
    codigo,
    sigla: estado.sigla,
    nome: estado.nome
  })).sort((a, b) => a.nome.localeCompare(b.nome));
};

// Funções para manipulação de municípios
export const getMunicipios = (): Municipios => {
  return municipios as Municipios;
};

export const getMunicipiosPorEstado = (codigoEstado: string): { codigo: string; nome: string }[] => {
  const municipiosObj = getMunicipios();
  
  // Filtra municípios pelo código do estado (os dois primeiros dígitos do código do município)
  return Object.entries(municipiosObj)
    .filter(([codigo]) => codigo.startsWith(codigoEstado))
    .map(([codigo, nome]) => ({
      codigo,
      nome
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
};

// Função para obter o nome do município pelo código
export const getNomeMunicipio = (codigo: string): string => {
  const municipiosObj = getMunicipios();
  return municipiosObj[codigo] || '';
};

// Função para obter o nome do estado pela sigla
export const getNomeEstadoPorSigla = (sigla: string): string => {
  const estadosObj = getEstados();
  const estado = Object.values(estadosObj).find(e => e.sigla === sigla);
  return estado ? estado.nome : '';
};

// Função para obter o código do estado pela sigla
export const getCodigoEstadoPorSigla = (sigla: string): string => {
  const estadosObj = getEstados();
  const estadoEntry = Object.entries(estadosObj).find(([, estado]) => estado.sigla === sigla);
  return estadoEntry ? estadoEntry[0] : '';
};
