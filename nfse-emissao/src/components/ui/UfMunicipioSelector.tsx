'use client';

import { useEffect, useState } from 'react';
import Select, { SingleValue, StylesConfig } from 'react-select';
import { getEstadosArray, getMunicipiosPorEstado, getCodigoEstadoPorSigla } from '@/lib/ibge/utils';

type OptionType = {
  value: string;
  label: string;
};

type OptionMunicipio = OptionType & { codigo: string; nome: string };

interface UfMunicipioSelectorProps {
  defaultUf?: string;
  defaultCodigoMunicipio?: string;
  onUfChange?: (uf: string) => void;
  onMunicipioChange?: (codigoMunicipio: string) => void;
  showMunicipio?: boolean; // novo: permite ocultar o combo de município
}

export default function UfMunicipioSelector({
  defaultUf = '',
  defaultCodigoMunicipio = '',
  onUfChange,
  onMunicipioChange,
  showMunicipio = true
}: UfMunicipioSelectorProps) {
  const [estados, setEstados] = useState<{codigo: string; sigla: string; nome: string}[]>([]);
  const [municipios, setMunicipios] = useState<{codigo: string; nome: string}[]>([]);
  const [selectedUf, setSelectedUf] = useState<string>(defaultUf);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>(defaultCodigoMunicipio);

  // Carrega a lista de estados ao iniciar o componente
  useEffect(() => {
    const estadosArray = getEstadosArray();
    setEstados(estadosArray);
  }, []);

  // Carrega a lista de municípios quando o estado é selecionado
  useEffect(() => {
    if (selectedUf) {
      const codigoEstado = getCodigoEstadoPorSigla(selectedUf);
      if (codigoEstado) {
        const municipiosList = getMunicipiosPorEstado(codigoEstado.substring(0, 2));
        setMunicipios(municipiosList);
      } else {
        setMunicipios([]);
      }
    } else {
      setMunicipios([]);
    }
  }, [selectedUf]);

  // Atualiza o estado interno quando as props mudam
  useEffect(() => {
    if (defaultUf !== selectedUf) {
      setSelectedUf(defaultUf);
      // Limpa o município selecionado quando a UF muda
      if (defaultCodigoMunicipio !== selectedMunicipio) {
        setSelectedMunicipio('');
      }
    }
  }, [defaultUf, defaultCodigoMunicipio, selectedUf, selectedMunicipio]);

  // Atualiza o município selecionado depois que a lista de municípios foi carregada
  useEffect(() => {
    if (defaultCodigoMunicipio && municipios.length > 0) {
      
      // Tenta encontrar o município exato
      let municipioExiste = municipios.some(m => m.codigo === defaultCodigoMunicipio);
      
      // Se não encontrar, tenta com os últimos 5 dígitos (formato do IBGE vs formato interno)
      if (!municipioExiste && defaultCodigoMunicipio.length > 5) {
        const codigo5Digitos = defaultCodigoMunicipio.slice(-5);
        municipioExiste = municipios.some(m => m.codigo === codigo5Digitos);
        
        if (municipioExiste) {
          setSelectedMunicipio(codigo5Digitos);
          return;
        }
      }
      
      // Se não encontrar, tenta com os primeiros 5 dígitos
      if (!municipioExiste && defaultCodigoMunicipio.length > 5) {
        const codigo5Digitos = defaultCodigoMunicipio.substring(0, 5);
        municipioExiste = municipios.some(m => m.codigo === codigo5Digitos);
        
        if (municipioExiste) {
          setSelectedMunicipio(codigo5Digitos);
          return;
        }
      }
      
      // Se encontrou o código exato
      if (municipioExiste) {
        setSelectedMunicipio(defaultCodigoMunicipio);
      } else {
      }
    }
  }, [defaultCodigoMunicipio, municipios]);

  // Preparar os dados para o react-select
  const estadosOptions = estados.map(estado => ({
    value: estado.sigla,
    label: `${estado.sigla} - ${estado.nome}`
  }));

  const municipiosOptions: OptionMunicipio[] = municipios.map(municipio => ({
    value: municipio.codigo,
    label: `${municipio.codigo} - ${municipio.nome}`,
    codigo: municipio.codigo,
    nome: municipio.nome
  }));

  // Encontrar os valores selecionados para react-select
  const selectedEstadoOption = estadosOptions.find(option => option.value === selectedUf) || null;
  const selectedMunicipioOption = municipiosOptions.find(option => option.value === selectedMunicipio) || null;

  // Estilo customizado para o react-select
  const customStylesUF: StylesConfig<OptionType, false> = {
    control: (provided) => ({
      ...provided,
      minHeight: '42px',
      height: 'auto',
      boxShadow: 'none',
      padding: '2px 8px',
      minWidth: '100%',
      '&:hover': {
        borderColor: '#6366F1'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      width: '100%'
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '250px'
    }),
    option: (provided) => ({
      ...provided,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      padding: '10px 12px',
      fontSize: '0.875rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      maxWidth: '100%',
      fontSize: '0.875rem'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }),
    input: (provided) => ({
      ...provided,
      maxWidth: '100%'
    })
  };

  const customStylesMunicipio: StylesConfig<OptionMunicipio, false> = {
    control: (provided) => ({
      ...provided,
      minHeight: '42px',
      height: 'auto',
      boxShadow: 'none',
      padding: '2px 8px',
      minWidth: '100%',
      '&:hover': {
        borderColor: '#6366F1'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      width: '100%'
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '250px'
    }),
    option: (provided) => ({
      ...provided,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      padding: '10px 12px',
      fontSize: '0.875rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      maxWidth: '100%',
      fontSize: '0.875rem'
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }),
    input: (provided) => ({
      ...provided,
      maxWidth: '100%'
    })
  };

  // Componente personalizado para exibir o município no select
  const formatOptionLabel = ({ codigo, nome }: OptionMunicipio) => (
    <div className="flex flex-col">
      <div className="font-medium">{nome}</div>
      <div className="text-xs text-gray-500">{codigo}</div>
    </div>
  );

  return (
    <div className={`grid grid-cols-1 ${showMunicipio ? 'md:grid-cols-2' : ''} gap-4 w-full`}>
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
        <Select
          name="uf-select"
          options={estadosOptions}
          value={selectedEstadoOption}
          onChange={(option: SingleValue<OptionType>) => {
            const uf = option?.value || '';
            setSelectedUf(uf);
            setSelectedMunicipio('');
            if (onUfChange) onUfChange(uf);
            if (onMunicipioChange) onMunicipioChange('');
          }}
          placeholder="Selecione um estado"
          isClearable
          isSearchable
          className="basic-single"
          classNamePrefix="select"
          styles={customStylesUF}
          noOptionsMessage={() => "Nenhum estado encontrado"}
        />
        <input type="hidden" name="uf" id="uf" defaultValue={defaultUf} />
      </div>
      {showMunicipio && (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Código do Município</label>
        <Select
          name="codigoMunicipio-select"
          options={municipiosOptions}
          value={selectedMunicipioOption}
          onChange={(option: SingleValue<OptionMunicipio>) => {
            setSelectedMunicipio(option?.value || '');
            // Atualizar o campo hidden
            const hiddenInput = document.getElementById('codigoMunicipio') as HTMLInputElement;
            if (hiddenInput) hiddenInput.value = option?.value || '';
            if (onMunicipioChange) onMunicipioChange(option?.value || '');
          }}
          placeholder="Selecione um município"
          formatOptionLabel={formatOptionLabel}
          isClearable
          isSearchable
          isDisabled={!selectedUf}
          className="basic-single"
          classNamePrefix="select"
          styles={customStylesMunicipio}
          noOptionsMessage={() => "Nenhum município encontrado"}
        />
        <input type="hidden" name="codigoMunicipio" id="codigoMunicipio" defaultValue={defaultCodigoMunicipio} />
      </div>
      )}
    </div>
  );
}
