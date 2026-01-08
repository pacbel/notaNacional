document.addEventListener('DOMContentLoaded', function() {
  // Carregar dados dos prestadores, tomadores e serviços
  let prestadoresData = [];
  let tomadoresData = [];
  let servicosData = [];
  
  try {
    // Carregar dados dos prestadores
    const prestadoresDataElement = document.getElementById('prestadoresData');
    if (prestadoresDataElement && prestadoresDataElement.textContent) {
      prestadoresData = JSON.parse(prestadoresDataElement.textContent);
      console.log('Dados dos prestadores carregados:', prestadoresData);
    }
    
    // Carregar dados dos tomadores
    const tomadoresDataElement = document.getElementById('tomadoresData');
    if (tomadoresDataElement && tomadoresDataElement.textContent) {
      tomadoresData = JSON.parse(tomadoresDataElement.textContent);
      console.log('Dados dos tomadores carregados:', tomadoresData);
    }
    
    // Carregar dados dos serviços
    const servicosDataElement = document.getElementById('servicosData');
    if (servicosDataElement && servicosDataElement.textContent) {
      servicosData = JSON.parse(servicosDataElement.textContent);
      console.log('Dados dos serviços carregados:', servicosData);
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
  
  // Adicionar evento ao botão de emissão direta
  const btnEmitirDirect = document.getElementById('emitirNfseDirect');
  if (btnEmitirDirect) {
    btnEmitirDirect.addEventListener('click', async function() {
      try {
        // Mostrar mensagem de carregamento
        const textoOriginal = btnEmitirDirect.innerHTML;
        btnEmitirDirect.innerHTML = '<span class="animate-pulse">Processando...</span>';
        btnEmitirDirect.disabled = true;
        
        // Obter dados do formulário
        const form = document.getElementById('emitirNfseForm');
        const prestadorId = form.querySelector('select[name="prestadorId"]').value;
        const tomadorId = form.querySelector('select[name="tomadorId"]').value;
        const numero = form.querySelector('input[name="numero"]').value;
        const dataEmissao = form.querySelector('input[name="dataEmissao"]').value;
        const naturezaOperacao = form.querySelector('select[name="naturezaOperacao"]').value;
        const discriminacao = form.querySelector('textarea[name="discriminacao"]').value;
        const valorServicos = form.querySelector('input[name="valorServicos"]').value;
        const baseCalculo = form.querySelector('input[name="baseCalculo"]').value;
        const aliquota = form.querySelector('input[name="aliquota"]').value;
        const issRetido = form.querySelector('select[name="issRetido"]').value;
        
        // Validar dados obrigatórios
        if (!prestadorId || !tomadorId || !numero || !dataEmissao || !valorServicos) {
          alert('Por favor, preencha todos os campos obrigatórios.');
          btnEmitirDirect.innerHTML = textoOriginal;
          btnEmitirDirect.disabled = false;
          return;
        }
        
        // Encontrar dados do prestador e tomador
        const prestador = prestadoresData.find(p => p.id === prestadorId);
        const tomador = tomadoresData.find(t => t.id === tomadorId);
        
        if (!prestador || !tomador) {
          alert('Prestador ou tomador não encontrado.');
          btnEmitirDirect.innerHTML = textoOriginal;
          btnEmitirDirect.disabled = false;
          return;
        }
        
        // Formatar data de emissão
        const dataEmissaoObj = new Date(dataEmissao);
        const dataEmissaoFormatada = dataEmissaoObj.toISOString().replace('Z', '');
        
        // Construir o JSON para envio
        const jsonData = {
          "ambiente": prestador.ambiente,
          "LoteRps": {
            "Id": "lote",
            "versao": "1.00",
            "NumeroLote": "1",
            "Cnpj": prestador.cnpj,
            "InscricaoMunicipal": prestador.inscricaoMunicipal,
            "QuantidadeRps": 1,
            "ListaRps": {
              "Rps": {
                "Id": prestador.serie,
                "InfRps": {
                  "Id": `rps:${prestador.serie}`,
                  "IdentificacaoRps": {
                    "Numero": numero,
                    "Serie": prestador.serie,
                    "Tipo": "1"
                  },
                  "DataEmissao": dataEmissaoFormatada,
                  "NaturezaOperacao": naturezaOperacao,
                  "OptanteSimplesNacional": prestador.optanteSimplesNacional ? "1" : "2",
                  "IncentivadorCultural": prestador.incentivadorCultural ? "1" : "2",
                  "Status": "1",
                  "Servico": {
                    "Valores": {
                      "ValorServicos": valorServicos,
                      "BaseCalculo": baseCalculo,
                      "ValorDeducoes": "0",
                      "ValorPis": "0",
                      "ValorCofins": "0",
                      "ValorInss": "0",
                      "ValorIr": "0",
                      "ValorCsll": "0",
                      "IssRetido": issRetido,
                      "OutrasRetencoes": "0",
                      "Aliquota": (parseFloat(aliquota) / 100).toString(),
                      "DescontoIncondicionado": "0",
                      "DescontoCondicionado": "0"
                    },
                    "ItemListaServico": "1.03", // Valor padrão, poderia ser obtido do serviço selecionado
                    "CodigoTributacaoMunicipio": "10300188", // Valor padrão, poderia ser obtido do serviço selecionado
                    "Discriminacao": discriminacao,
                    "CodigoMunicipio": "3106200" // Valor padrão, poderia ser obtido do prestador
                  },
                  "Prestador": {
                    "Cnpj": prestador.cnpj,
                    "InscricaoMunicipal": prestador.inscricaoMunicipal
                  },
                  "Tomador": {
                    "IdentificacaoTomador": {
                      "CpfCnpj": {
                        "Cnpj": tomador.cpfCnpj
                      },
                      "InscricaoMunicipal": tomador.inscricaoMunicipal
                    },
                    "RazaoSocial": tomador.razaoSocial,
                    "Endereco": {
                      "Endereco": tomador.endereco,
                      "Numero": tomador.numero,
                      "Complemento": tomador.complemento,
                      "Bairro": tomador.bairro,
                      "CodigoMunicipio": tomador.codigoMunicipio,
                      "Uf": tomador.uf,
                      "Cep": tomador.cep
                    },
                    "Contato": {
                      "Telefone": tomador.telefone,
                      "Email": tomador.email
                    }
                  }
                }
              }
            }
          }
        };
        
        console.log('JSON a ser enviado:', jsonData);
        
        // Enviar requisição para o endpoint usando caminho relativo
        const response = await fetch('/api/nfse/emitir-nfse-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': '123456' // Token de autorização conforme visto no endpoint
          },
          body: JSON.stringify(jsonData)
        });
        
        // Processar resposta
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Resposta da API:', responseData);
        
        if (responseData.success) {
          alert(`Nota fiscal emitida com sucesso! Protocolo: ${responseData.protocolo}`);
          // Redirecionar para a página de listagem de notas fiscais
          window.location.href = '/nfse';
        } else {
          alert(`Erro ao emitir nota fiscal: ${responseData.message}`);
          btnEmitirDirect.innerHTML = textoOriginal;
          btnEmitirDirect.disabled = false;
        }
      } catch (error) {
        console.error('Erro ao emitir nota fiscal:', error);
        alert(`Erro ao emitir nota fiscal: ${error.message}`);
        btnEmitirDirect.innerHTML = textoOriginal;
        btnEmitirDirect.disabled = false;
      }
    });
  }
});
