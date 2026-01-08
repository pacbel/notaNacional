'use client';

import { useEffect, useState } from 'react';
import { getEstadosArray, getMunicipiosPorEstado, getCodigoEstadoPorSigla } from '@/lib/ibge/utils';
import Select, { SingleValue, StylesConfig } from 'react-select';

type OptionType = {
  value: string;
  label: string;
};

interface EstadoMunicipioSelectorProps {
  defaultUf?: string;
  defaultCodigoMunicipio?: string;
  onEstadoChange?: (uf: string) => void;
  onMunicipioChange?: (codigoMunicipio: string) => void;
}

export default function EstadoMunicipioSelector({
  defaultUf = '',
  defaultCodigoMunicipio = '',
  onEstadoChange,
  onMunicipioChange
}: EstadoMunicipioSelectorProps) {
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

  // Atualiza o estado selecionado
  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uf = e.target.value;
    setSelectedUf(uf);
    setSelectedMunicipio('');
    if (onEstadoChange) onEstadoChange(uf);
  };

  // Atualiza o município selecionado
  const handleMunicipioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const codigoMunicipio = e.target.value;
    setSelectedMunicipio(codigoMunicipio);
    if (onMunicipioChange) onMunicipioChange(codigoMunicipio);
  };

  // Preparar os dados para o react-select
  const estadosOptions = estados.map(estado => ({
    value: estado.sigla,
    label: `${estado.sigla} - ${estado.nome}`
  }));

  const municipiosOptions = municipios.map(municipio => ({
    value: municipio.codigo,
    label: `${municipio.codigo} - ${municipio.nome}`
  }));

  // Encontrar os valores selecionados para react-select
  const selectedEstadoOption = estadosOptions.find(option => option.value === selectedUf) || null;
  const selectedMunicipioOption = municipiosOptions.find(option => option.value === selectedMunicipio) || null;

  // Estilo customizado para o react-select
  const customStyles: StylesConfig<OptionType, false> = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      height: 'auto',
      boxShadow: 'none',
      padding: '2px 8px',
      '&:hover': {
        borderColor: '#6366F1'
      }
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      width: '100%'
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '250px'
    }),
    option: (base) => ({
      ...base,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      padding: '10px 12px'
    }),
    singleValue: (base) => ({
      ...base,
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      maxWidth: '100%'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 8px',
      maxWidth: '100%',
      overflow: 'hidden'
    }),
    input: (base) => ({
      ...base,
      maxWidth: '100%'
    })
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
        <Select
          name="uf"
          options={estadosOptions}
          value={selectedEstadoOption}
          onChange={(option: SingleValue<OptionType>) => handleEstadoChange({ target: { value: option?.value || '' } } as React.ChangeEvent<HTMLSelectElement>)}
          placeholder="Selecione um estado"
          isClearable
          isSearchable
          className="basic-single"
          classNamePrefix="select"
          styles={customStyles}
          noOptionsMessage={() => "Nenhum estado encontrado"}
        />
        <input type="hidden" name="uf" value={selectedUf} />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código do Município</label>
        <Select
          name="codigoMunicipio"
          options={municipiosOptions}
          value={selectedMunicipioOption}
          onChange={(option: SingleValue<OptionType>) => handleMunicipioChange({ target: { value: option?.value || '' } } as React.ChangeEvent<HTMLSelectElement>)}
          placeholder="Selecione um município"
          isClearable
          isSearchable
          isDisabled={!selectedUf}
          className="basic-single"
          classNamePrefix="select"
          styles={customStyles}
          noOptionsMessage={() => "Nenhum município encontrado"}
        />
        <input type="hidden" name="codigoMunicipio" value={selectedMunicipio} />
      </div>
    </div>
  );
}
