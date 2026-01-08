// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed da lista de serviços...');

  // Verifica se já existem registros
  const count = await prisma.listaServicos.count();
  
  if (count === 0) {
    console.log('Inserindo serviços na tabela listaServicos...');
    
    // Insere todos os registros
    await prisma.listaServicos.createMany({
      data: [
        {
          id: '2ddde590-03b8-4998-a3e2-a5cef62a516c',
          codigo: '750010001',
          codigoItem: '1.01',
          descricao: 'ANÁLISE E DESENVOLVIMENTO DE SISTEMAS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '884dc181-d181-4394-bc99-6428c6aa3fab',
          codigo: '010200188',
          codigoItem: '1.02',
          descricao: 'PROGRAMAÇÃO',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '6e06abe0-d3e3-49fa-b74c-a582c3db58b3',
          codigo: '010200288',
          codigoItem: '1.02',
          descricao: 'CUSTOMIZAÇÃO DE PROGRAMAS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'c9eee8d0-0764-423d-b692-c8fcdb9bafe1',
          codigo: '010300188',
          codigoItem: '1.03',
          descricao: 'PROCESSAMENTO DE DADOS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'd0374de9-f66b-416d-858e-ebc01fd9cf27',
          codigo: '010300288',
          codigoItem: '1.03',
          descricao: 'PROVIMENTO DE ACESSO À INTERNET',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'c50ad158-1bfe-4a0d-b97c-5ff9593c1b59',
          codigo: '010300388',
          codigoItem: '1.03',
          descricao: 'PROVIMENTO DE CONTEÚDO PARA A INTERNET',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '04b0aa6b-4906-4c76-bf1d-2fa515b8b2ad',
          codigo: '010300488',
          codigoItem: '1.03',
          descricao: 'PROVIMENTO DE SERVIÇO DE APLICAÇÃO PARA INTERNET',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'ff93c2e1-8f67-49fd-970f-931e9b221dba',
          codigo: '010300588',
          codigoItem: '1.03',
          descricao: 'HOSPEDAGEM PARA A INTERNET',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '4db077d6-3bfd-45ff-83b3-c0109e754ffd',
          codigo: '010300688',
          codigoItem: '1.03',
          descricao: 'SERVIÇOS DE DATA CENTER',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '13ed6b07-b02d-4d22-a4e9-a52eb9d51254',
          codigo: '010300788',
          codigoItem: '1.03',
          descricao: 'OUTROS SERVIÇOS DE PROCESSAMENTO DE DADOS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'cd4ce5a7-d00b-4b76-a55c-9ee0e7e3ae2c',
          codigo: '010400188',
          codigoItem: '1.04',
          descricao: 'ELABORAÇÃO DE PROGRAMAS DE COMPUTADORES',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'a8c2b967-6d70-4aad-9144-3ceffd58fb19',
          codigo: '010400288',
          codigoItem: '1.04',
          descricao: 'ELABORAÇÃO DE JOGOS ELETRÔNICOS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'fa25498e-d7d9-4bb8-abd4-c7f893648f65',
          codigo: '010500188',
          codigoItem: '1.05',
          descricao: 'LICENCIAMENTO OU CESSÃO DE DIREITO DE USO DE PROGRAMAS DE COMPUTAÇÃO',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: 'bc43faa3-a97c-4a09-9cb3-744f25419d22',
          codigo: '010600188',
          codigoItem: '1.06',
          descricao: 'ASSESSORIA E CONSULTORIA EM INFORMÁTICA - PORTAIS, PROVEDORES DE CONTEÚDO E OUTROS SERVIÇOS DE INFORMAÇÃO NA INTERNET',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '26184e16-cf44-4291-af8c-57bb4fe3fbe1',
          codigo: '010700188',
          codigoItem: '1.07',
          descricao: 'SUPORTE TÉCNICO EM INFORMÁTICA, INCLUSIVE INSTALAÇÃO, CONFIGURAÇÃO E MANUTENÇÃO DE PROGRAMAS DE COMPUTAÇÃO E BANCO DE DADOS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '50dd47b6-ebbc-4c75-9dfe-79a558d66db1',
          codigo: '010800188',
          codigoItem: '1.08',
          descricao: 'PLANEJAMENTO DE PÁGINAS ELETRÔNICAS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '3d925538-44ce-43ac-b0d6-c66b63641d0d',
          codigo: '010800288',
          codigoItem: '1.08',
          descricao: 'CONFECÇÃO DE PÁGINAS ELETRÔNICAS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '1f120925-7c99-4111-9139-ca809cc34b9a',
          codigo: '010800388',
          codigoItem: '1.08',
          descricao: 'MANUTENÇÃO DE PÁGINAS ELETRÔNICAS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '9eb1e45f-bded-464d-be5d-ba95c649ccd7',
          codigo: '010800488',
          codigoItem: '1.08',
          descricao: 'ATUALIZAÇÃO DE PÁGINAS ELETRÔNICAS',
          categoria: 'Serviços de Informática e Tecnologia'
        },
        {
          id: '7c4581de-db63-4955-8a10-c6b89b99f719',
          codigo: '016100100',
          codigoItem: '7.13',
          descricao: 'SERVICO DE PULVERIZACAO E CONTROLE DE PRAGAS AGRICOLAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: 'a6e4287d-44a2-4b97-88c8-b873b18e7840',
          codigo: '016100200',
          codigoItem: '7.11',
          descricao: 'SERVICO DE PODA DE ARVORES PARA LAVOURAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: 'd29989d1-7c21-4cb1-bb13-d391ad8a157d',
          codigo: '016100300',
          codigoItem: '7.16',
          descricao: 'SERVICO DE PREPARACAO DE TERRENO, CULTIVO E COLHEITA',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '5f00d8e4-c7cd-49ba-a031-c710d4f4b9d4',
          codigo: '016109900',
          codigoItem: '17.01',
          descricao: 'ATIVIDADES DE APOIO A AGRICULTURA NAO RELACIONADOS ANTERIORMENTE',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '75f065a0-f78f-40ca-8857-daf589841d9c',
          codigo: '016109901',
          codigoItem: '7.22',
          descricao: 'SERVICO DE NUCLEACAO E BOMBARDEAMENTO DE NUVENS E CONGENERES',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '83f6665a-25b6-493a-a201-483b229dfa3f',
          codigo: '016280100',
          codigoItem: '5.04',
          descricao: 'SERVICO DE INSEMINACAO ARTIFICIAL EM ANIMAIS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '8c4c4a68-5953-413d-ae90-b4a4a85a704a',
          codigo: '016280200',
          codigoItem: '5.08',
          descricao: 'SERVICO DE TOSQUIAMENTO DE OVELHAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '60961b87-9df8-4231-b07e-fcf75c795bd5',
          codigo: '016280300',
          codigoItem: '5.08',
          descricao: 'SERVICO DE MANEJO DE ANIMAIS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '47bc53cd-60b7-43b7-a189-e97d5bc49620',
          codigo: '016289900',
          codigoItem: '5.04',
          descricao: 'ATIVIDADES DE APOIO A PECUARIA NAO ESPECIFICADAS ANTERIORMENTE',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: 'd32ab5ae-f097-4932-8fe7-82baa3079dd8',
          codigo: '016360000',
          codigoItem: '7.16',
          descricao: 'ATIVIDADES DE POS-COLHEITA',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: 'ac28c732-61bd-4032-8575-c34ba661b19e',
          codigo: '020100188',
          codigoItem: '2.01',
          descricao: 'SERVIÇOS DE PESQUISAS E DESENVOLVIMENTO DE QUALQUER NATUREZA',
          categoria: 'Pesquisa e Desenvolvimento'
        },
        {
          id: '97b0ae92-f771-4193-a275-e9a97df8e569',
          codigo: '021010700',
          codigoItem: '7.16',
          descricao: 'EXTRACAO DE MADEIRAS EM FLORESTAS PLANTADAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '343db9dc-ac1c-4ea2-9523-d77e21d08834',
          codigo: '021019900',
          codigoItem: '7.16',
          descricao: 'PRODUCAO DE PRODUTOS NAO-MADEIREIROS NAO ESPECIFICADOS ANTERIORMENTE EM FLORESTAS PLANTADAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '7fc9f805-f29d-4cfb-8098-230540866304',
          codigo: '022090100',
          codigoItem: '7.16',
          descricao: 'EXTRACAO DE MADEIRAS EM FLORESTAS NATIVAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '6eac7b84-72bc-4031-8547-aba04bf84e9c',
          codigo: '022090300',
          codigoItem: '26.01',
          descricao: 'COLETA DE CASTANHA-DO-PARA EM FLORESTAS NATIVAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '0803207a-e1b8-40c1-92b9-9414f79efae2',
          codigo: '022090400',
          codigoItem: '26.01',
          descricao: 'COLETA DE LATEX EM FLORESTAS NATIVAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '835ea72d-68da-4d53-93ae-d9cf66c47990',
          codigo: '022090500',
          codigoItem: '26.01',
          descricao: 'COLETA DE PALMITO EM FLORETAS NATIVAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '80e5dc87-e44c-41e5-9e68-12e817a47955',
          codigo: '022090600',
          codigoItem: '7.16',
          descricao: 'CONSERVACAO DE FLORESTAS NATIVAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '7a90145f-fc25-4a54-a7eb-8e70b3668e88',
          codigo: '022099900',
          codigoItem: '26.01',
          descricao: 'COLETA DE PRODUTOS NAO-MADEIREIROS NAO ESPECIFICADOS ANTERIORMENTE EM FLORESTAS NATIVAS',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '12702412-d2d3-40b4-b315-2c71ca34a696',
          codigo: '023060000',
          codigoItem: '7.16',
          descricao: 'ATIVIDADES DE APOIO A PRODUCAO FLORESTAL',
          categoria: 'Serviços Agrícolas e Florestais'
        },
        {
          id: '001b80e0-89e2-4a8a-abc7-94877793c5d3',
          codigo: '030200188',
          codigoItem: '3.02',
          descricao: 'CESSÃO DE DIREITO DE USO DE SINAIS DE PROPAGANDA',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'be88bfb0-cd82-4474-9ac2-c735cda22d82',
          codigo: '030200288',
          codigoItem: '3.02',
          descricao: 'CESSÃO DE DIREITO DE USO DE MARCA',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'df20be5d-3f45-4303-a3b4-07929b2f76c8',
          codigo: '030200388',
          codigoItem: '3.02',
          descricao: 'CESSÃO DE DIREITO DE USO DE SOM OU IMAGEM',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '696dd71f-db35-46f9-ad91-4ac96f1984cf',
          codigo: '030300188',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE SALÃO DE FESTAS',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'fdd82428-47b0-4e13-9085-6e4e88a32630',
          codigo: '030300288',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE CENTRO DE CONVENÇÕES',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'f650d19a-de15-42de-a5a9-5859ce290697',
          codigo: '030300388',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE ESCRITÓRIO VIRTUAL',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'e79a403f-e6ee-45bf-8363-644a39c12f00',
          codigo: '030300488',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE STAND',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '14a8a330-b2a3-45ba-852f-72e3b040b274',
          codigo: '030300588',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE QUADRA ESPORTIVA',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'e9a3e301-c34e-4153-b778-7b36013e0fb2',
          codigo: '030300688',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE ESTÁDIO',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '7337ff34-f2b8-4b64-b618-4455201ab389',
          codigo: '030300788',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE GINÁSIO',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'd3d60cb5-2fdd-487f-8cf6-0b3064fc5313',
          codigo: '030300888',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE AUDITÓRIO',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '7987dabf-c70c-44b9-84e6-1723f8ef433d',
          codigo: '030300988',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE CASA DE ESPETÁCULOS',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '7abb665f-74e1-4a50-a49a-9a336192b88b',
          codigo: '030301088',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE PARQUE DE DIVERSÕES',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '1588e1c9-26fd-47eb-9f29-70a5a9b0a9d0',
          codigo: '030301188',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE CANCHAS',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'bd30a45f-31e6-4f95-aab8-4d13f814a50f',
          codigo: '030301288',
          codigoItem: '3.03',
          descricao: 'SERVIÇOS DE LOCAÇÃO E CESSÃO DE USO DE ESPAÇOS DESTINADOS INSTALAÇÃO DE STANDS OU BOX EM SHOPPINGS POPULARES, FEIRAS SHOP E EMPREENDIMENTOS SEMELHANTES, A CARGO DO PROPRIETÁRIO DO EMPREENDIMENTO',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '7f463b6f-5eb2-4552-82f0-a0735142640e',
          codigo: '030301388',
          codigoItem: '3.03',
          descricao: 'EXPLORAÇÃO DE OUTRAS INSTALAÇÕES PARA REALIZAÇÃO DE EVENTOS OU NEGÓCIOS DE QUALQUER NATUREZA',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'c01b4f8c-5ff6-4497-9198-2d067cd9b59a',
          codigo: '030400188',
          codigoItem: '3.04',
          descricao: 'LOCAÇÃO, SUBLOCAÇÃO, ARRENDAMENTO, DIREITO DE PASSAGEM OU PERMISSÃO DE USO, COMPARTILHADO OU NÃO, DE FERROVIA, RODOVIA, POSTES, CABOS, DUTOS E CONDUTOS DE QUALQUER NATUREZA',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '8b28648e-fc3f-46cf-b848-b4e5ba46431a',
          codigo: '030500188',
          codigoItem: '3.05',
          descricao: 'CESSÃO DE ANDAIMES',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'd21ac923-2c00-4ed6-a1ea-144fda1ee4a6',
          codigo: '030500288',
          codigoItem: '3.05',
          descricao: 'CESSÃO DE PALCO',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '0f4ba7fa-c899-413b-83c2-afbe8073d959',
          codigo: '030500388',
          codigoItem: '3.05',
          descricao: 'CESSÃO DE COBERTURAS OU TENDAS',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: '7c54feaf-a881-4a85-a40c-f6dfcd9bb7b1',
          codigo: '030500488',
          codigoItem: '3.05',
          descricao: 'CESSÃO DE OUTRAS ESTRUTURAS DE USO TEMPORÁRIO',
          categoria: 'Cessão de Direitos e Locação'
        },
        {
          id: 'f2ade653-4994-40a5-b29a-92d6bfc2fad0',
          codigo: '031160300',
          codigoItem: '26.01',
          descricao: 'COLETA DE OUTROS PRODUTOS MARINHOS',
          categoria: 'Pesca e Aquicultura'
        },
        {
          id: '8ec19dc2-3ac1-4e81-b8f9-0bb4510c40af',
          codigo: '031160400',
          codigoItem: '17.01',
          descricao: 'ATIVIDADES DE APOIO A PESCA EM AGUA SALGADA',
          categoria: 'Pesca e Aquicultura'
        },
        {
          id: 'bc284f04-17f2-44dd-9de5-31fa5aec7cf6',
          codigo: '031240300',
          codigoItem: '26.01',
          descricao: 'COLETA DE OUTROS PRODUTOS AQUATICOS DE AGUA DOCE',
          categoria: 'Pesca e Aquicultura'
        },
        {
          id: '5cee823b-b845-435e-b81d-296599bcbef1',
          codigo: '031240400',
          codigoItem: '17.01',
          descricao: 'ATIVIDADES DE APOIO A PESCA EM AGUA DOCE',
          categoria: 'Pesca e Aquicultura'
        },
        {
          id: '62e90a13-0257-43f7-a051-14c5e565b502',
          codigo: '032130500',
          codigoItem: '17.01',
          descricao: 'ATIVIDADES DE APOIO A AQUICULTURA EM AGUA SALGADA E SALOBRA',
          categoria: 'Pesca e Aquicultura'
        },
        {
          id: '8c249802-c0ab-48e3-bd64-ce5ab403051d',
          codigo: '032210700',
          codigoItem: '17.01',
          descricao: 'ATIVIDADES DE APOIO A AQUICULTURA EM AGUA DOCE',
          categoria: 'Pesca e Aquicultura'
        },
        {
          id: '00d57ae1-0a5b-4cb9-9d67-fd7f78f06e54',
          codigo: '040100188',
          codigoItem: '4.01',
          descricao: 'MEDICINA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'bdf5edc7-5863-4f6a-b99e-591047d21b8d',
          codigo: '040100288',
          codigoItem: '4.01',
          descricao: 'BIOMEDICINA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '019b65e0-234d-491e-a722-0c86bafb251a',
          codigo: '040100388',
          codigoItem: '4.01',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE MEDICINA E BIOMEDICINA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '331f2caa-8139-4813-8c77-6098de68cd65',
          codigo: '040200188',
          codigoItem: '4.02',
          descricao: 'ANÁLISES CLÍNICAS, PATOLÓGICAS, CITOPATOLÓGICA, DE MATERIAL GENÉTICO E CONGÊNERES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '75c365d6-d524-441a-ae0f-b6f13d681337',
          codigo: '040200288',
          codigoItem: '4.02',
          descricao: 'RADIOTERAPIA, QUIMIOTERAPIA, HEMOTERAPIA, LITOTRIPSIA E CONGÊNERES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'b0a8cb95-83f2-4a23-8e6f-9e6e8671e566',
          codigo: '040200388',
          codigoItem: '4.02',
          descricao: 'RADIOLOGIA, ENDOSCOPIA, ULTRASSONOGRAFIA, RESSONÂNCIA MAGNÉTICA, RADIOLOGIA, TOMOGRAFIA, ELETRICIDADE MÉDICA, AUDIOMETRIA E CONGÊNERES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '7a28e229-e2d4-497a-bb63-1df688236571',
          codigo: '040200488',
          codigoItem: '4.02',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE ANÁLISES CLÍNICAS, PATOLOGIA, CITOPATOLÓGICA, ELETRICIDADE MÉDICA, RADIOTERAPIA, QUIMIOTERAPIA, ULTRASSONOGRAFIA, RESSONÂNCIA MAGNÉTICA, RADIOLOGIA, TOMOGRAFIA E CONGÊNERES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'd75fc613-4537-404b-bca4-6903c54b198c',
          codigo: '040300188',
          codigoItem: '4.03',
          descricao: 'SERVIÇOS DE HOSPITAIS, CLÍNICAS, SANATÓRIOS, MANICÔMIOS, CASAS DE SAÚDE, PRONTOS-SOCORROS, AMBULATÓRIOS E CONGÊNERES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '11eebd6a-70ae-4fe7-836d-e9ba35840cb4',
          codigo: '040300288',
          codigoItem: '4.03',
          descricao: 'SERVIÇO DE ATENDIMENTO A PESSOA PORTADORA DE DEFICIÊNCIA PRESTADO POR CLÍNICA ESPECIALIZADA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'a7f48398-4437-499d-acad-04a8c6ffff67',
          codigo: '040300388',
          codigoItem: '4.03',
          descricao: 'SERVIÇOS DE LABORATÓRIO, EXCETO ANÁLISES CLÍNICAS, PATOLÓGICAS, CITOPATOLÓGICA E DE MATERIAL GENÉTICO',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '6849c22f-5240-4010-87e4-a7e82daadf6f',
          codigo: '040300488',
          codigoItem: '4.03',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE HOSPITAIS, CLÍNICAS, LABORATÓRIOS, SANATÓRIOS, MANICÔMIOS, CASAS DE SAÚDE, PRONTOS-SOCORROS, AMBULATÓRIOS E CONGÊNERES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '31fbeea4-bc29-4ceb-bc58-8036510f99f0',
          codigo: '040300588',
          codigoItem: '4.03',
          descricao: 'SERVIÇOS DE LABORATÓRIO DE ANÁLISES CLÍNICAS, PATOLÓGICAS, CITOPATOLÓGICA E DE MATERIAL GENÉTICO',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '0afda393-bf0c-44cc-bb83-beffdf34b286',
          codigo: '040400188',
          codigoItem: '4.04',
          descricao: 'INSTRUMENTAÇÃO CIRÚRGICA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'f1ce6410-c74a-4fd9-b82a-5ddf32f7df29',
          codigo: '040400288',
          codigoItem: '4.04',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE INSTRUMENTAÇÃO CIRÚRGICA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '8b77d1b4-4cca-45f0-bf04-6a501cfbbc9a',
          codigo: '040500188',
          codigoItem: '4.05',
          descricao: 'ACUPUNTURA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'b9ae5a52-09d4-4b0f-a1e8-cbe9a00b4322',
          codigo: '040500288',
          codigoItem: '4.05',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE ACUPUNTURA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'ddd41dce-f051-4589-8140-87ec3305cd8b',
          codigo: '040600188',
          codigoItem: '4.06',
          descricao: 'ENFERMAGEM, INCLUSIVE SERVIÇOS AUXILIARES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '69d47a92-797f-4051-9860-41786957df9f',
          codigo: '040600288',
          codigoItem: '4.06',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE ENFERMAGEM, INCLUSIVE SERVIÇOS AUXILIARES',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '6c6156cb-dff5-415c-9466-d826080d2dc4',
          codigo: '040700188',
          codigoItem: '4.07',
          descricao: 'SERVIÇOS DE MANIPULAÇÃO DE FÓRMULAS',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'c7a9961a-27c7-4804-a44e-de136fca6497',
          codigo: '040700288',
          codigoItem: '4.07',
          descricao: 'OUTROS SERVIÇOS FARMACÊUTICOS',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '313bd291-b88e-4b3d-b899-c8e79e0ff85c',
          codigo: '040700388',
          codigoItem: '4.07',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS FARMACÊUTICOS',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '3fcad480-7322-4b9f-86d5-438f53ef257b',
          codigo: '040800188',
          codigoItem: '4.08',
          descricao: 'TERAPIA OCUPACIONAL, FISIOTERAPIA E FONOAUDIOLOGIA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '414e7e72-10c8-492b-8804-a66479df361e',
          codigo: '040800288',
          codigoItem: '4.08',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE TERAPIA OCUPACIONAL, FISIOTERAPIA E FONOAUDIOLOGIA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'ca322c43-94ec-48ff-9b64-946eb79271f5',
          codigo: '040900188',
          codigoItem: '4.09',
          descricao: 'TERAPIAS DE QUALQUER ESPÉCIE DESTINADAS AO TRATAMENTO FÍSICO, ORGÂNICO E MENTAL, INCLUSIVE RPG, REIKI, SHIATSU, CROMOTERAPIA E OUTRAS',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '48df5d29-5a2e-468a-acb2-8eff03b625c4',
          codigo: '040900288',
          codigoItem: '4.09',
          descricao: 'SERVIÇOS DE REABILITAÇÃO PROFISSIONAL',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'cd16028b-d3d7-4a7c-842b-5229e9125692',
          codigo: '040900388',
          codigoItem: '4.09',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE TERAPIAS DE QUALQUER ESPÉCIE DESTINADAS AO TRATAMENTO FÍSICO, ORGÂNICO E MENTAL',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '6068a7f9-07b1-4d12-92ca-5655a2235f97',
          codigo: '041000188',
          codigoItem: '4.10',
          descricao: 'NUTRIÇÃO',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '21348b71-670c-44b4-ba6d-c661475ed13b',
          codigo: '041000288',
          codigoItem: '4.10',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE NUTRIÇÃO',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '29e5c174-42f6-4bdc-bebb-fda4c8078671',
          codigo: '041100188',
          codigoItem: '4.11',
          descricao: 'OBSTETRÍCIA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '0bee8261-b445-48da-b3d1-5890f753c443',
          codigo: '041100288',
          codigoItem: '4.11',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE OBSTETRÍCIA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'bca3e6b3-b60e-446a-a818-cbd983e23d1a',
          codigo: '041200188',
          codigoItem: '4.12',
          descricao: 'SERVIÇOS ODONTOLÓGICOS',
          categoria: 'Serviços de Saúde'
        },
        {
          id: '2149fdc6-350a-4d46-911e-97a88d0bae62',
          codigo: '041200288',
          codigoItem: '4.12',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE ODONTOLOGIA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'bb59ede8-04ee-4af2-98b6-caa02d17c6ed',
          codigo: '041300188',
          codigoItem: '4.13',
          descricao: 'ORTÓPTICA',
          categoria: 'Serviços de Saúde'
        },
        {
          id: 'a1fad972-4090-411c-9548-18d863eab111',
          codigo: '041300288',
          codigoItem: '4.13',
          descricao: 'CONVÊNIO OU CONTRATO CELEBRADO COM O SUS - SISTEMA ÚNICO DE SAÚDE PARA PRESTAÇÃO DE SERVIÇOS DE ORTÓPTICA',
          categoria: 'Serviços de Saúde'
        }
      ],
      skipDuplicates: true,
    });
    
    console.log('✅ Lista de serviços inserida com sucesso!');
  } else {
    console.log('ℹ️  A tabela listaServicos já contém registros. Nenhum dado foi inserido.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
