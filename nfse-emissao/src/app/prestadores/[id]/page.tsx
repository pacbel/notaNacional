import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Prestador } from '@/types/prestador';
import PrestadorFormWrapper from './PrestadorFormWrapper';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrestadorFormPage({ params }: PageProps) {
  // Aguardar os parâmetros da rota
  const routeParams = await Promise.resolve(params);
  
  // Buscar dados do prestador se for edição
  const isNew = routeParams.id === 'novo';
  const prestador = !isNew ? await prisma.prestador.findUnique({
    where: { id: routeParams.id },
    // Seleciona apenas colunas já existentes no banco para evitar 500
    select: {
      id: true,
      razaoSocial: true,
      cnpj: true,
      nomeFantasia: true,
      inscricaoMunicipal: true,
      email: true,
      telefone: true,
      endereco: true,
      numero: true,
      complemento: true,
      bairro: true,
      cep: true,
      uf: true,
      codigoMunicipio: true,
      serie: true,
      ambiente: true,
      optanteSimplesNacional: true,
      incentivadorCultural: true,
      exibirConstrucaoCivil: true,
      numeroRpsAtual: true,
      regimeEspecialTributacao: true,
      integrado_asaas: true,
      customer_id_asaas: true,
      emitirNfse: true,
      emitirNfe: true,
      nfeAmbiente: true,
      numeroNfeAtual: true,
      nfeSerie: true,
      // Novos campos tributários
      codigoTributacao: true,
      itemListaServico: true,
      aliquota: true,
      codigoTribNacional: true,
      exigibilidadeIss: true,
      issRetido: true,
      tipoImunidade: true,
      valorTribFederal: true,
      valorTribEstadual: true,
      totalTribMunicipal: true,
    }
  }) as unknown as Prestador | null : null;

  if (!isNew && prestador) {
    console.log('SSR /prestadores/[id] - prestador carregado (page.tsx):', {
      id: (prestador as any).id,
      codigoTributacao: (prestador as any).codigoTributacao,
      itemListaServico: (prestador as any).itemListaServico,
      aliquota: (prestador as any).aliquota,
      codigoTribNacional: (prestador as any).codigoTribNacional,
      exigibilidadeIss: (prestador as any).exigibilidadeIss,
      issRetido: (prestador as any).issRetido,
      tipoImunidade: (prestador as any).tipoImunidade,
      valorTribFederal: (prestador as any).valorTribFederal,
      valorTribEstadual: (prestador as any).valorTribEstadual,
      totalTribMunicipal: (prestador as any).totalTribMunicipal,
    });
  }

  // Preparar os valores padrão
  const defaultValues = {
    razaoSocial: prestador?.razaoSocial ?? '',
    cnpj: prestador?.cnpj ?? '',
    nomeFantasia: prestador?.nomeFantasia ?? '',
    inscricaoMunicipal: prestador?.inscricaoMunicipal ?? '',
    inscricaoEstadual: (prestador as any)?.inscricaoEstadual ?? '',
    email: prestador?.email ?? '',
    telefone: prestador?.telefone ?? '',
    endereco: prestador?.endereco ?? '',
    numero: prestador?.numero ?? '',
    complemento: prestador?.complemento ?? '',
    bairro: prestador?.bairro ?? '',
    cep: prestador?.cep ?? '',
    uf: prestador?.uf ?? '',
    codigoMunicipio: prestador?.codigoMunicipio ?? '',
    serie: (prestador as any)?.serie ?? '1',
    ambiente: (prestador as any)?.ambiente ?? 2, // 2 = Homologação
    optanteSimplesNacional: (prestador as any)?.optanteSimplesNacional ?? false,
    incentivadorCultural: (prestador as any)?.incentivadorCultural ?? false,
    exibirConstrucaoCivil: (prestador as any)?.exibirConstrucaoCivil ?? false,
    numeroRpsAtual: (prestador as any)?.numeroRpsAtual ?? 100,
    regimeEspecialTributacao: (prestador as any)?.regimeEspecialTributacao ?? 0,
    integrado_asaas: (prestador as any)?.integrado_asaas ?? false,
    customer_id_asaas: (prestador as any)?.customer_id_asaas ?? '',
    emitirNfse: (prestador as any)?.emitirNfse ?? true,
    emitirNfe: (prestador as any)?.emitirNfe ?? false,
    nfeAmbiente: (prestador as any)?.nfeAmbiente ?? 2,
    numeroNfeAtual: (prestador as any)?.numeroNfeAtual ?? 1,
    nfeSerie: (prestador as any)?.nfeSerie ?? '1',
    // Defaults dos campos tributários
    codigoTribNacional: (prestador as any)?.codigoTribNacional ?? '',
    codigoTributacao: (prestador as any)?.codigoTributacao ?? '',
    itemListaServico: (prestador as any)?.itemListaServico ?? '',
    aliquota: (prestador as any)?.aliquota ?? 0,
    exigibilidadeIss: (prestador as any)?.exigibilidadeIss ?? 2,
    issRetido: (prestador as any)?.issRetido ?? false,
    tipoImunidade: (prestador as any)?.tipoImunidade ?? 3,
    valorTribFederal: (prestador as any)?.valorTribFederal ?? 0,
    valorTribEstadual: (prestador as any)?.valorTribEstadual ?? 0,
    totalTribMunicipal: (prestador as any)?.totalTribMunicipal ?? 0,
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Novo Prestador' : 'Emitente'}</h1>
        <Link href="/prestadores" className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors">
          Voltar
        </Link>
      </div>
      
      <PrestadorFormWrapper isNew={isNew} prestador={prestador} defaultValues={defaultValues} />
    </div>
  );
}
