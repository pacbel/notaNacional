'use client';

import { useState, useEffect } from 'react';
import React, { use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestador } from '@/contexts/PrestadorContext';
import { obterCobranca, formatarValor, formatarData, processarPagamentoCartao } from '@/services/asaasService';
import { AsaasCobranca } from '@/services/asaasService';
import { consultarCep, CepResponse } from '@/services/cepService';
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// Funções de formatação para substituir o InputMask
const formatarCartao = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const groups = [];
  
  for (let i = 0; i < digits.length && i < 16; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  
  return groups.join(' ');
};

const formatarCPF = (value: string) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 11) {
    // Formatar como CPF: 000.000.000-00
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  } else {
    // Formatar como CNPJ: 00.000.000/0000-00
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  }
};

const formatarCEP = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

const formatarTelefone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^\((\d{2})\) (\d{4})(\d)/, '($1) $2-$3');
  } else {
    // Celular: (00) 00000-0000
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^\((\d{2})\) (\d{5})(\d)/, '($1) $2-$3');
  }
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PagamentoCartaoPage({ params }: PageProps) {
  const { user, isAdmin } = useAuth();
  const { prestador } = usePrestador();
  const router = useRouter();
  // Usar React.use() para desembrulhar o objeto params antes de acessar suas propriedades
  const { id } = React.use(params);
  
  const [cobranca, setCobranca] = useState<AsaasCobranca | null>(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [endereco, setEndereco] = useState<string>('');
  const [bairro, setBairro] = useState<string>('');
  const [cidade, setCidade] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Dados do cartão
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [mesExpiracao, setMesExpiracao] = useState('');
  const [anoExpiracao, setAnoExpiracao] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Dados do titular
  const [nomeTitular, setNomeTitular] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [telefone, setTelefone] = useState('');

  // Verificar se o usuário tem permissão para acessar esta página
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Carregar os detalhes da cobrança
  useEffect(() => {
    const carregarCobranca = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const dadosCobranca = await obterCobranca(id);
        setCobranca(dadosCobranca);
        
        // Não preencher dados automaticamente conforme solicitado
        
      } catch (err) {
        console.error('Erro ao carregar cobrança:', err);
        setError('Não foi possível carregar os detalhes da mensalidade. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarCobranca();
  }, [id]);

  // Verificar se um campo está vazio
  const campoVazio = (valor: string) => {
    return valor.trim() === '';
  };

  // Função para lidar com os dados do CEP encontrado
  const handleCepFound = (data: CepResponse) => {
    // Preencher os campos de endereço
    setEndereco(data.logradouro || '');
    setBairro(data.bairro || '');
    setCidade(data.localidade || '');
    setEstado(data.uf || '');
    
    // Exibir mensagem de sucesso
    toast.success('CEP encontrado! Endereço preenchido automaticamente.');
  };

  // Função para buscar CEP
  const buscarCep = async (cepDigitado: string) => {
    if (!cepDigitado || cepDigitado.length < 8) return;
    
    try {
      const cepLimpo = cepDigitado.replace(/\D/g, '');
      const data = await consultarCep(cepLimpo);
      
      if (data) {
        handleCepFound(data);
      } else {
        toast.error('CEP não encontrado ou inválido');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
    }
  };

  // Função para processar o pagamento
  const processarPagamento = async () => {
    if (!cobranca || !prestador?.cnpj) return;
    
    // Lista para armazenar os campos que estão vazios
    const camposVazios: string[] = [];
    
    // Verificar apenas os campos obrigatórios conforme a documentação do ASAAS
    if (campoVazio(numeroCartao)) camposVazios.push('Número do Cartão');
    if (campoVazio(nomeCartao)) camposVazios.push('Nome no Cartão');
    if (campoVazio(mesExpiracao)) camposVazios.push('Mês de Expiração');
    if (campoVazio(anoExpiracao)) camposVazios.push('Ano de Expiração');
    if (campoVazio(cvv)) camposVazios.push('CVV');
    if (campoVazio(cpfCnpj)) camposVazios.push('CPF/CNPJ');
    
    // Se houver campos vazios, mostrar erro com a lista de campos
    if (camposVazios.length > 0) {
      setError(`Por favor, preencha os seguintes campos obrigatórios: ${camposVazios.join(', ')}.`);
      return;
    }
    
    setProcessando(true);
    setError(null);
    
    try {
      // Formatar dados para a API
      const numeroCartaoLimpo = numeroCartao.replace(/\D/g, '');
      const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '');
      const telefoneLimpo = telefone.replace(/\D/g, '');
      const cepLimpo = cep.replace(/\D/g, '');
      
      // Preparar os dados do cartão
      const dadosCartao = {
        creditCard: {
          holderName: nomeCartao,
          number: numeroCartaoLimpo,
          expiryMonth: mesExpiracao,
          expiryYear: anoExpiracao.length === 2 ? `20${anoExpiracao}` : anoExpiracao,
          ccv: cvv
        },
        creditCardHolderInfo: {
          name: nomeTitular || nomeCartao, // Se o nome do titular não for preenchido, usa o nome do cartão
          email: email,
          cpfCnpj: cpfCnpjLimpo,
          postalCode: cepLimpo,
          addressNumber: numero,
          addressComplement: complemento,
          phone: telefoneLimpo,
          // Incluindo os campos de endereço
          address: endereco,
          province: bairro,
          city: cidade,
          state: estado
        }
      };

      // Verificar se o prestador tem customer_id_asaas
      if (!prestador.customer_id_asaas) {
        toast.error('Prestador não possui integração com o ASAAS. Entre em contato com o suporte.');
        setProcessando(false);
        return;
      }

      const dadosPagamento = {
        id: cobranca.id, // ID da cobrança existente para pagamento
        customer: prestador.customer_id_asaas, // Usando o customer_id_asaas em vez do CNPJ
        billingType: 'CREDIT_CARD',
        value: cobranca.value,
        dueDate: cobranca.dueDate,
        description: cobranca.description,
        ...dadosCartao
      };
      
      const resultado = await processarPagamentoCartao(dadosPagamento);
      
      if (resultado.success) {
        setSuccess(true);
        toast.success('Pagamento processado com sucesso!');
      } else {
        toast.error(resultado.message || 'Não foi possível processar o pagamento. Por favor, verifique os dados do cartão e tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao processar pagamento:', err);
      toast.error('Não foi possível processar o pagamento. Por favor, verifique os dados do cartão e tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  // Renderizar tela de sucesso
  if (success) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-green-600">Pagamento Realizado com Sucesso!</h2>
          </div>
          <div className="p-6 pt-0 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg mb-4">
              Seu pagamento foi processado com sucesso. Você receberá um e-mail com a confirmação.
            </p>
            <p className="text-gray-500 mb-6">
              O status da sua mensalidade será atualizado em breve.
            </p>
          </div>
          <div className="p-6 pt-0 flex justify-center">
            <Link href="/mensalidades" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-10 px-4 py-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Mensalidades
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-row items-center justify-between p-6">
          <h2 className="text-2xl font-bold">Pagamento com Cartão de Crédito</h2>
          <Link href="/mensalidades" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-white hover:bg-gray-100 h-9 px-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </div>
        <div className="p-6 pt-0">
          {error && (
            <div className="relative w-full rounded-lg border border-red-500 bg-red-50 text-red-900 p-4 mb-4">
              <AlertCircle className="h-4 w-4 inline-block mr-2" />
              <h5 className="mb-1 font-medium leading-none tracking-tight inline-block">Erro</h5>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse rounded-md bg-gray-200 w-full h-12" />
              <div className="animate-pulse rounded-md bg-gray-200 w-full h-32" />
              <div className="animate-pulse rounded-md bg-gray-200 w-full h-48" />
            </div>
          ) : cobranca ? (
            <div className="space-y-6">
              {/* Detalhes da cobrança */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Detalhes da Mensalidade</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Descrição</p>
                    <p className="font-medium">{cobranca.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vencimento</p>
                    <p className="font-medium">{formatarData(cobranca.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor</p>
                    <p className="font-medium text-lg text-green-600">{formatarValor(cobranca.value)}</p>
                  </div>
                </div>
              </div>

              {/* Formulário de pagamento */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    Dados do Cartão
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="numeroCartao" className="text-sm font-medium leading-none mb-2 block">Número do Cartão <span className="text-red-500">*</span></label>
                      <input
                        id="numeroCartao"
                        placeholder="0000 0000 0000 0000"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={numeroCartao}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setNumeroCartao(formatarCartao(e.target.value));
                        }}
                        maxLength={19}
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="nomeCartao" className="text-sm font-medium leading-none mb-2 block">Nome no Cartão <span className="text-red-500">*</span></label>
                      <input
                        id="nomeCartao"
                        placeholder="Como está impresso no cartão"
                        value={nomeCartao}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeCartao(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="mesExpiracao" className="text-sm font-medium leading-none mb-2 block">Mês de Expiração <span className="text-red-500">*</span></label>
                      <input
                        id="mesExpiracao"
                        placeholder="MM"
                        maxLength={2}
                        value={mesExpiracao}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                            setMesExpiracao(value);
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="anoExpiracao" className="text-sm font-medium leading-none mb-2 block">Ano de Expiração <span className="text-red-500">*</span></label>
                      <input
                        id="anoExpiracao"
                        placeholder="AA"
                        maxLength={2}
                        value={anoExpiracao}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnoExpiracao(e.target.value.replace(/\D/g, ''))}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="text-sm font-medium leading-none mb-2 block">CVV <span className="text-red-500">*</span></label>
                      <input
                        id="cvv"
                        placeholder="123"
                        maxLength={4}
                        value={cvv}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCvv(e.target.value.replace(/\D/g, ''))}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-4">Dados do Titular</h3>
                  <p className="text-sm text-gray-500 mb-4">Campos marcados com <span className="text-red-500">*</span> são obrigatórios conforme a documentação do ASAAS.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="nomeTitular" className="text-sm font-medium leading-none mb-2 block">Nome Completo</label>
                      <input
                        id="nomeTitular"
                        value={nomeTitular}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeTitular(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="cpfCnpj" className="text-sm font-medium leading-none mb-2 block">CPF/CNPJ <span className="text-red-500">*</span></label>
                      <input
                        id="cpfCnpj"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={cpfCnpj}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setCpfCnpj(formatarCPF(e.target.value));
                        }}
                        maxLength={18}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium leading-none mb-2 block">E-mail</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="cep" className="text-sm font-medium leading-none mb-2 block">CEP</label>
                      <div className="flex">
                        <input
                          id="cep"
                          placeholder="00000-000"
                          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={cep}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setCep(formatarCEP(e.target.value));
                          }}
                          maxLength={9}
                        />
                        <button 
                          type="button"
                          onClick={() => buscarCep(cep)}
                          className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Buscar
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="numero" className="text-sm font-medium leading-none mb-2 block">Número</label>
                      <input
                        id="numero"
                        value={numero}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumero(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="complemento" className="text-sm font-medium leading-none mb-2 block">Complemento (opcional)</label>
                      <input
                        id="complemento"
                        value={complemento}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComplemento(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="endereco" className="text-sm font-medium leading-none mb-2 block">Endereço</label>
                      <input
                        id="endereco"
                        value={endereco}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndereco(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="bairro" className="text-sm font-medium leading-none mb-2 block">Bairro</label>
                      <input
                        id="bairro"
                        value={bairro}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBairro(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="cidade" className="text-sm font-medium leading-none mb-2 block">Cidade</label>
                      <input
                        id="cidade"
                        value={cidade}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCidade(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="estado" className="text-sm font-medium leading-none mb-2 block">Estado</label>
                      <input
                        id="estado"
                        value={estado}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstado(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label htmlFor="telefone" className="text-sm font-medium leading-none mb-2 block">Telefone</label>
                      <input
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={telefone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setTelefone(formatarTelefone(e.target.value));
                        }}
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Cobrança não encontrada.</p>
            </div>
          )}
        </div>
        {!loading && cobranca && (
          <div className="flex items-center p-6 pt-0 justify-between">
            <Link href="/mensalidades" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-white hover:bg-gray-100 h-10 px-4 py-2">
              Cancelar
            </Link>
            <button 
              onClick={processarPagamento} 
              disabled={processando}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white h-10 px-4 py-2 disabled:opacity-50"
            >
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar {formatarValor(cobranca.value)}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
