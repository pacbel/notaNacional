# Scripts de Reset e Seed do Banco de Dados NFSe

Este diretório contém scripts para automatizar a preparação do banco de dados do sistema NFSe, incluindo o reset, migração, seed e geração de inserts da tabela CNAE.

## Requisitos
- Node.js 18+
- npm
- MySQL (ou compatível)
- Dependências do projeto instaladas (`npm install` na raiz do projeto)

---

## 1. Gerar o SQL completo da tabela CNAE

O script `cnae-to-sql.js` converte o arquivo `CorrelacaoCNAE.txt` em um arquivo SQL de inserts para a tabela `cnae`.

### Como executar:

```sh
npx ts-node cnae-to-sql.js
```

- O arquivo de origem deve ser `../public/docs/tributacao/CorrelacaoCNAE.txt`.
- O arquivo gerado será `CorrelacaoCNAE.sql` nesta mesma pasta.
- O script pode ser executado sempre que o arquivo TXT for atualizado.

---

## 2. Resetar, migrar e popular o banco de dados

O script `reset-db-and-seed.js` executa todas as etapas para:
- Resetar o banco (drop e recriação das tabelas)
- Aplicar as migrations
- Popular tabelas principais e auxiliares (incluindo CNAE)

### Como executar:

```sh
npx ts-node reset-db-and-seed.js
```

O script irá:
- Executar as migrations (`prisma db push`)
- Rodar todos os seeds (inclusive o seed de CNAE, que lê o arquivo `CorrelacaoCNAE.sql` gerado anteriormente)

---

## Fluxo recomendado

1. Gere o SQL da tabela CNAE sempre que atualizar o arquivo TXT:
   ```sh
   npx ts-node cnae-to-sql.js
   ```
2. Em seguida, rode o reset e seed do banco:
   ```sh
   npx ts-node reset-db-and-seed.js
   ```

---

## Observações
- Todos os scripts devem ser executados a partir da raiz do projeto ou da pasta `prisma`.
- Garanta que o banco de dados esteja acessível e configurado corretamente no `.env`.
- O arquivo `CorrelacaoCNAE.sql` é sobrescrito a cada execução do conversor.
- O seed de CNAE lê diretamente o arquivo SQL gerado.

Em caso de dúvidas, consulte o código dos scripts ou peça suporte ao time de desenvolvimento.
