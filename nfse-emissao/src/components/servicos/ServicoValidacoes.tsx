'use client';

import { useEffect, useState } from 'react';

interface ServicoValidacoesProps {
  valorUnitario: number;
  valorDeducoes: number;
  descontoIncondicionado: number;
  baseCalculo: number;
  valorLiquido: number;
  descricao: string;
}

export default function ServicoValidacoes({
  valorUnitario,
  valorDeducoes,
  descontoIncondicionado,
  baseCalculo,
  valorLiquido,
  descricao
}: ServicoValidacoesProps) {
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    const novosErros: string[] = [];

    // Validação do valor total
    if (!valorUnitario || valorUnitario <= 0) {
      novosErros.push("Valor dos serviços é obrigatório e deve ser maior que zero");
    }

    // Validação da descrição
    if (!descricao || descricao.trim() === '') {
      novosErros.push("Descrição do serviço é obrigatória");
    }

    // Validação das deduções
    if (valorDeducoes > valorUnitario) {
      novosErros.push("Valor das deduções não pode ser maior que o valor total");
    }

    // Validação do desconto incondicionado
    if (descontoIncondicionado > (valorUnitario - valorDeducoes)) {
      novosErros.push("Desconto incondicionado não pode ser maior que (Valor Total - Deduções)");
    }

    // Validação da base de cálculo
    if (baseCalculo <= 0) {
      novosErros.push("Base de cálculo do ISS deve ser maior que zero");
    }

    // Validação do valor líquido
    if (valorLiquido <= 0) {
      novosErros.push("Valor líquido deve ser maior que zero");
    }

    setErros(novosErros);
  }, [valorUnitario, valorDeducoes, descontoIncondicionado, baseCalculo, valorLiquido, descricao]);

  if (erros.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
      <h3 className="text-red-700 font-medium mb-2">Atenção! Corrija os seguintes erros:</h3>
      <ul className="list-disc pl-5 text-red-600">
        {erros.map((erro, index) => (
          <li key={index}>{erro}</li>
        ))}
      </ul>
    </div>
  );
}
